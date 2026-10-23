// The contact agent: finds the email a restaurant publishes on its own website, so
// its owner can be invited to recycle shells. Gemini decides what to do; its tools run
// here on the server. Each step is passed to `emit` as it happens, so the page can
// show the agent at work, and an email is only reported once it has been found on a
// page the agent opened.
import { lookup } from 'node:dns/promises'
import { BlockList } from 'node:net'

const instruction = `You are GoodRiddance's contact finder. Given a New York restaurant from its DoorDash listing, find an email address the restaurant itself publishes, so the owner of another restaurant can invite them to recycle their oyster shells.

1. Call search_web to find the restaurant's own website, using its name and street address.
2. Call open_page on the restaurant's own site, such as its home or contact page. A page lists the emails on it and links to other pages on the same site. If the email isn't there, open the contact, about or events page.
3. Once a page you opened shows an email, call report_contact. If the restaurant has no website, or its site lists no email after a few pages, call report_not_found.

Rules:
- Report an email exactly as a page you opened lists it. Never guess or build one from a domain, and never take one from search results alone.
- Make sure the site is this restaurant at this address, not a namesake or another branch. For evidence, quote text from the site exactly, such as its street address.
- Prefer a general inbox (info@, hello@, contact@) or a manager's email over careers, press, gift card or booking-platform addresses.
- Skip directories, review sites, delivery apps and social media.`

const config = {
  systemInstruction: instruction,
  tools: [
    {
      functionDeclarations: [
        {
          name: 'search_web',
          description: 'Search Google. Returns the result pages and a short summary of what they say.',
          parametersJsonSchema: {
            type: 'object',
            properties: { query: { type: 'string' } },
            required: ['query'],
          },
        },
        {
          name: 'open_page',
          description: 'Open a page on a site that came up in your searches. Returns its text, the emails on it and links to its other pages.',
          parametersJsonSchema: {
            type: 'object',
            properties: { url: { type: 'string', description: 'The page’s full https URL.' } },
            required: ['url'],
          },
        },
        {
          name: 'report_contact',
          description: 'Finish with the email you found. It is checked against the pages you opened.',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', description: 'The email exactly as the page lists it.' },
              evidence: { type: 'string', description: 'Text quoted exactly from the site that shows it is this restaurant, such as its street address.' },
              note: { type: 'string', description: 'One sentence on whose inbox this is and why you chose it.' },
            },
            required: ['email', 'evidence', 'note'],
          },
        },
        {
          name: 'report_not_found',
          description: 'Finish without an email.',
          parametersJsonSchema: {
            type: 'object',
            properties: { reason: { type: 'string', description: 'One sentence on what you checked.' } },
            required: ['reason'],
          },
        },
      ],
    },
  ],
  // Every turn must call a tool, so a run only ends with a report.
  toolConfig: { functionCallingConfig: { mode: 'ANY' } },
  thinkingConfig: { thinkingLevel: 'LOW' },
  maxOutputTokens: 4096,
}

const maxTurns = 10
const maxSearches = 3
const maxPages = 6
const httpOptions = { timeout: 60_000, retryOptions: { attempts: 2 } }

// Runs the agent for one restaurant. `emit` receives, in order:
// { type: 'start', model }, then any number of
//   { type: 'activity', text } — what Gemini is doing while we wait for it
//   { type: 'step', id, status: 'running' | 'done' | 'failed', icon, label, detail?, sites?, tone? }
//     — a step to show, sent again by id as it finishes
// and last { type: 'found', contact } or { type: 'not-found', reason }. Errors are thrown.
export async function findContact({ ai, model, restaurant, signal, emit }) {
  const sites = new Set() // domains in the search results: the only sites open_page will visit
  const pages = [] // pages opened so far, to check a reported email against
  let searches = 0
  let steps = 0
  let activity = 'Planning its search'

  // A step that takes a while: shown running, then updated through the returned function.
  function step(fields) {
    const id = ++steps
    emit({ type: 'step', id, status: 'running', ...fields })
    return (changes) => emit({ type: 'step', id, status: 'done', ...changes })
  }

  const tools = {
    // A separate Gemini call grounded in Google Search, as its results' pages only come
    // back with an answer in text, not alongside a tool call.
    async search_web({ query = '' }) {
      if (searches++ >= maxSearches) return { error: `Already searched ${maxSearches} times. Open a page or report what you found.` }
      const finish = step({ icon: 'search', label: `Searching Google for “${query}”` })
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `Search Google for: ${query}\nIn a few lines, say which results are the restaurant's own website and what they show about its contact details.`,
          // Searches sometimes hang for minutes; better to stop and let the agent try again.
          config: { tools: [{ googleSearch: {} }], thinkingConfig: { thinkingLevel: 'LOW' }, maxOutputTokens: 1024, abortSignal: signal, httpOptions: { timeout: 25_000 } },
        })
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
        const results = await Promise.all(chunks.filter((c) => c.web?.uri).map(async ({ web }) => ({ title: web.title, url: await sourceUrl(web) })))
        const found = [...new Set(results.map((r) => siteOf(r.url)))]
        found.forEach((site) => sites.add(site))
        finish({ label: `Searched Google for “${query}”`, detail: found.length ? `${found.length} sites in the results` : 'No results', sites: found.slice(0, 6) })
        activity = 'Choosing a page to open'
        return { summary: response.text ?? '', results: results.filter((r, i) => results.findIndex((other) => other.url === r.url) === i) }
      } catch (err) {
        if (signal.aborted) throw err
        console.error(err)
        finish({ status: 'failed', tone: 'failed', label: `Couldn’t search for “${query}”`, detail: 'Google Search didn’t answer.' })
        return { error: 'The search failed. Try again or report what you found.' }
      }
    },

    async open_page({ url = '' }) {
      let target
      try {
        target = new URL(url)
      } catch {
        return { error: 'Give a full URL, starting with https://.' }
      }
      const finish = step({ icon: 'arrow', label: `Opening ${shortUrl(target)}` })
      const refuse = (error) => {
        finish({ status: 'failed', tone: 'fix', label: `Skipped ${shortUrl(target)}`, detail: error })
        return { error }
      }
      if (![...sites].some((site) => sameSite(site, siteOf(target)))) {
        return refuse('Not a site from the search results. Search first.')
      }
      if (pages.length >= maxPages) return refuse(`Already opened ${maxPages} pages. Report what you found.`)
      try {
        const page = readPage(await fetchHtml(target, signal))
        pages.push(page)
        const listed = page.emails.map((e) => e.email)
        finish({
          label: `Read ${shortUrl(new URL(page.url))}`,
          detail: `${page.words.toLocaleString()} words · ${listed.length ? listed.slice(0, 3).join(', ') + (listed.length > 3 ? ` and ${listed.length - 3} more` : '') : 'no email addresses'}`,
        })
        activity = `Reading ${shortUrl(new URL(page.url))}`
        return { url: page.url, title: page.title, emails: page.emails, links: page.links, text: page.text.slice(0, 12_000) }
      } catch (err) {
        if (signal.aborted) throw err
        finish({ status: 'failed', tone: 'failed', label: `Couldn’t open ${shortUrl(target)}`, detail: openError(err) })
        return { error: `Couldn’t open that page. ${openError(err)}` }
      }
    },

    report_contact({ email = '', evidence = '', note = '' }) {
      email = email.trim().toLowerCase()
      const finish = step({ icon: 'check', label: `Checking ${email} is on the site` })
      const page = pages.find((p) => p.emails.some((e) => e.email === email))
      const quote = normalize(evidence)
      let error
      if (!page) error = `${email} isn’t on any page you opened. Report an email exactly as a page lists it.`
      else if (quote.length < 8 || !pages.some((p) => sameSite(siteOf(p.url), siteOf(page.url)) && normalize(p.text).includes(quote))) {
        error = 'The evidence isn’t quoted exactly from that site. Copy its text exactly, such as the street address.'
      }
      if (error) {
        finish({ status: 'failed', tone: 'fix', label: `Couldn’t verify ${email || 'that email'}`, detail: error })
        activity = 'Correcting its answer'
        return { error }
      }
      finish({ icon: 'mail', label: `Verified ${email}`, detail: `Listed on ${shortUrl(new URL(page.url))}` })
      emit({ type: 'found', contact: { email, sourceUrl: page.url, evidence: evidence.trim(), note } })
      return { done: true }
    },

    report_not_found({ reason = '' }) {
      emit({ type: 'not-found', reason })
      return { done: true }
    },
  }

  emit({ type: 'start', model })
  const contents = [{ role: 'user', parts: [{ text: describe(restaurant) }] }]
  for (let turn = 0; turn < maxTurns; turn++) {
    emit({ type: 'activity', text: activity })
    const response = await ai.models.generateContent({ model, contents, config: { ...config, abortSignal: signal, httpOptions } })
    const [candidate] = response.candidates ?? []
    if (!candidate?.content?.parts?.length) {
      throw new Error(`Gemini returned no answer (${candidate?.finishReason ?? 'no candidates'}).`)
    }
    // Sent back exactly as received: Gemini 3 needs the thought signatures in it.
    contents.push(candidate.content)

    const calls = candidate.content.parts.filter((part) => part.functionCall).map((part) => part.functionCall)
    if (!calls.length) throw new Error('The agent stopped without an answer.')
    activity = 'Deciding what to do next'
    const results = []
    // One at a time, so the steps show in the order Gemini asked for them.
    for (const { id, name, args = {} } of calls) {
      const result = Object.hasOwn(tools, name) ? await tools[name](args) : { error: `There is no tool named ${name}.` }
      if (result.done) return
      results.push({ functionResponse: { ...(id && { id }), name, response: result } })
    }
    contents.push({ role: 'user', parts: results })
  }
  throw new Error(`The agent didn’t finish in ${maxTurns} turns.`)
}

function describe(r) {
  return `Find a contact email for this restaurant.\n${JSON.stringify({
    name: r.name,
    street: r.street,
    neighborhood: r.neighborhood,
    city: 'New York, NY',
    doordash: r.doordashUrl,
  })}`
}

// ---- Opening pages ----

const maxPageBytes = 3_000_000
const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; GoodRiddanceBot/1.0)', Accept: 'text/html' }

// Private, loopback, link-local (incl. the metadata server), shared and multicast ranges.
const privateV4 = new BlockList()
for (const [address, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 3]]) {
  privateV4.addSubnet(address, prefix, 'ipv4')
}
// Global unicast IPv6, less 6to4 and Teredo, which can tunnel to IPv4 addresses.
const publicV6 = new BlockList()
publicV6.addSubnet('2000::', 3, 'ipv6')
const tunnelV6 = new BlockList()
tunnelV6.addSubnet('2002::', 16, 'ipv6')
tunnelV6.addSubnet('2001::', 32, 'ipv6')

function isPublic({ address, family }) {
  if (family === 4) return !privateV4.check(address, 'ipv4')
  // On IPv6-only networks, NAT64 addresses carry an IPv4 address in their last 32 bits.
  const nat64 = address.match(/^64:ff9b::([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i)
  if (nat64) {
    const [high, low] = nat64.slice(1).map((group) => parseInt(group, 16))
    return isPublic({ address: `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`, family: 4 })
  }
  return publicV6.check(address, 'ipv6') && !tunnelV6.check(address, 'ipv6')
}

// GETs a public https page, following redirects one hop at a time so each host is
// checked before it's contacted. Pages over maxPageBytes are cut off, not refused.
async function fetchHtml(url, signal) {
  for (let hop = 0; hop < 5; hop++) {
    if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Only public https pages can be opened.')
    if (!(await lookup(url.hostname, { all: true })).every(isPublic)) throw new Error('That site isn’t on the public internet.')
    const res = await fetch(url, { headers, redirect: 'manual', signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) })
    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel()
      url = new URL(location, url)
      continue
    }
    if (!res.ok || !res.headers.get('content-type')?.includes('html')) {
      await res.body?.cancel()
      throw new Error(res.ok ? 'It isn’t a web page.' : `The site answered ${res.status}.`)
    }
    const chunks = []
    let size = 0
    for await (const chunk of res.body) {
      chunks.push(chunk)
      size += chunk.length
      if (size >= maxPageBytes) break
    }
    return { url: url.href, html: Buffer.concat(chunks).toString('utf8') }
  }
  throw new Error('It redirects too many times.')
}

// Search results link through a Google redirect; the agent is given where it leads.
async function sourceUrl({ uri, domain, title }) {
  try {
    if (new URL(uri).hostname !== 'vertexaisearch.cloud.google.com') return uri
    const res = await fetch(uri, { redirect: 'manual', signal: AbortSignal.timeout(5000) })
    await res.body?.cancel()
    const location = res.headers.get('location')
    if (location) return new URL(location).href
  } catch {}
  return `https://${domain ?? title}/`
}

function openError(err) {
  if (err.name === 'TimeoutError') return 'The site took too long to answer.'
  if (err.code === 'ENOTFOUND' || err.message === 'fetch failed') return 'The site couldn’t be reached.'
  return err.message
}

// ---- Reading pages ----

const emailPattern = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi
// Image names like logo@2x.png, and error-tracking addresses in site builders' code.
const notEmail = /(\.(png|jpe?g|gif|webp|svg|css|js)|sentry\.io|wixpress\.com|example\.com)$/i

// The page's text, the emails on it with the text around each, and links to the
// same site's other pages. Emails also come from mailto links, structured data and
// Cloudflare's email obfuscation, which keep them out of the visible text.
function readPage({ url, html }) {
  const text = clean(html.replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1\s*>/gi, ' '))
  const hidden = [
    ...[...html.matchAll(/mailto:([^"'?\s>]+)/gi)].map(([, address]) => decode(safeDecodeURI(address))),
    ...[...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(([, json]) => json),
    ...[...html.matchAll(/(?:data-cfemail="|email-protection#)([0-9a-f]{4,})/gi)].map(([, hex]) => cloudflareEmail(hex)),
  ]
  const emails = [...new Set([text, ...hidden].join(' ').match(emailPattern)?.map((e) => e.toLowerCase()))]
    .filter((email) => !notEmail.test(email))
    .map((email) => ({ email, context: around(text, email) }))

  const links = []
  for (const [, href, inner] of html.matchAll(/<a\b[^>]*?\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let link
    try {
      link = new URL(decode(href), url)
    } catch {
      continue
    }
    link.hash = ''
    if (link.protocol !== 'https:' || link.href === url || !sameSite(siteOf(link), siteOf(url))) continue
    if (/\.(pdf|jpe?g|png|gif|webp|svg|zip)$/i.test(link.pathname) || links.some((l) => l.url === link.href)) continue
    links.push({ text: clean(inner).slice(0, 60), url: link.href })
    if (links.length === 40) break
  }

  return {
    url,
    title: clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''),
    text,
    words: text.split(' ').length,
    emails,
    links,
  }
}

function clean(html) {
  return decode(html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', commat: '@', period: '.', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—' }

function decode(text) {
  return text.replace(/&(#x[0-9a-f]{1,5}|#\d{1,6}|[a-z]+);/gi, (entity, code) => {
    if (code[0] !== '#') return entities[code.toLowerCase()] ?? entity
    const point = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1))
    return point <= 0x10ffff ? String.fromCodePoint(point) : entity
  })
}

function safeDecodeURI(text) {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

// Cloudflare hides emails as hex bytes XOR-ed with the first byte.
function cloudflareEmail(hex) {
  const key = parseInt(hex.slice(0, 2), 16)
  return hex.slice(2).match(/../g).map((byte) => String.fromCharCode(parseInt(byte, 16) ^ key)).join('')
}

function around(text, email) {
  const at = text.toLowerCase().indexOf(email)
  return at < 0 ? '' : text.slice(Math.max(0, at - 100), at + email.length + 60)
}

// For comparing quotes: case, spacing and curly quotes don't matter.
function normalize(text) {
  return text.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
}

function siteOf(url) {
  return new URL(url).hostname.replace(/^www\./, '')
}

// order.example.com and example.com are the same site.
function sameSite(a, b) {
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`)
}

function shortUrl(url) {
  const path = url.pathname.replace(/\/$/, '')
  const short = url.hostname.replace(/^www\./, '') + path
  return short.length > 42 ? `${short.slice(0, 41)}…` : short
}

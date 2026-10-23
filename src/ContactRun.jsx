import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

const statusLabels = { working: 'Searching', found: 'Email found', 'not-found': 'No email listed', failed: 'Stopped' }
// The status badge's color: green with an email, amber once the agent stops without one.
const statusClasses = { working: '', found: 'ready', 'not-found': 'failed', failed: 'failed' }

// Runs the contact agent (server/contactAgent.js) for a restaurant. The server streams
// its progress as one JSON event per line, which `onEvent` gets as each one arrives.
async function streamContactSearch(restaurantId, onEvent, signal) {
  const res = await fetch(`/api/find-contact/${encodeURIComponent(restaurantId)}`, { method: 'POST', signal }).catch((err) => {
    throw signal.aborted ? err : new Error('Couldn’t reach the GoodRiddance server. Check your connection.')
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let partial = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return
    const lines = (partial + value).split('\n')
    partial = lines.pop()
    lines.filter(Boolean).forEach((line) => onEvent(JSON.parse(line)))
  }
}

// A run with one more event from the server applied. Steps arrive again by id as they finish.
function withEvent(run, event) {
  switch (event.type) {
    case 'activity': return { ...run, activity: event.text }
    case 'step': {
      const { type: _, ...step } = event
      const known = run.steps.some((s) => s.id === step.id)
      return { ...run, steps: known ? run.steps.map((s) => (s.id === step.id ? { ...s, ...step } : s)) : [...run.steps, step] }
    }
    case 'found': return { ...run, status: 'found', contact: event.contact }
    case 'not-found': return { ...run, status: 'not-found', reason: event.reason, contactPage: event.contactPage }
    case 'error': return { ...run, status: 'failed', error: event.error }
    default: return run
  }
}

// Contact searches by restaurant id: { status: 'working' | 'found' | 'not-found' | 'failed',
// steps, activity, contact, reason, contactPage, error }. Leaving the page stops them.
export function useContactFinder() {
  const [runs, setRuns] = useState({})
  const controllers = useRef({})
  useEffect(() => () => Object.values(controllers.current).forEach((c) => c.abort()), [])

  async function findContact(place) {
    const controller = (controllers.current[place.id] = new AbortController())
    const update = (change) => setRuns((all) => ({ ...all, [place.id]: change(all[place.id]) }))
    update(() => ({ status: 'working', steps: [], activity: 'Starting' }))
    try {
      await streamContactSearch(place.id, (event) => update((run) => withEvent(run, event)), controller.signal)
      update((run) => (run.status === 'working' ? { ...run, status: 'failed', error: 'The agent stopped without an answer.' } : run))
    } catch (err) {
      if (!controller.signal.aborted) update((run) => ({ ...run, status: 'failed', error: err.message }))
    }
  }

  return [runs, findContact]
}

function hostOf(url) {
  return new URL(url).hostname.replace(/^www\./, '')
}

// The contact agent's log for one restaurant: each search and page as it happens,
// then the email it verified on the restaurant's own site.
export default function ContactRun({ run, onRetry }) {
  const working = run.status === 'working'
  const { contact } = run
  // Keep the newest step in view as the log grows down the scrolling panel.
  const end = useRef(null)
  useEffect(() => end.current?.scrollIntoView({ block: 'nearest' }), [run.steps.length, run.status])

  return (
    <div className="agent-run contact-run">
      <div className="agent-run-head">
        <span className="agent-name"><Icon name="search" size={15} /> Contact agent</span>
        <span className={`agent-status ${statusClasses[run.status]}`}>{statusLabels[run.status]}</span>
      </div>

      <ol className="agent-steps" aria-label="What the agent did" aria-live="polite">
        {run.steps.map((step) => (
          <li key={step.id} className={step.tone}>
            {step.status === 'running' ? <span className="agent-pulse" /> : <Icon name={step.tone === 'failed' ? 'close' : step.icon} size={14} />}
            <span>
              <strong>{step.label}</strong>
              {step.detail && <small>{step.detail}</small>}
              {step.sites?.length > 0 && (
                <span className="contact-sites">{step.sites.map((site) => <span key={site} className="chip">{site}</span>)}</span>
              )}
            </span>
          </li>
        ))}
        {working && !run.steps.some((s) => s.status === 'running') && (
          <li className="pending">
            <span className="agent-pulse" />
            <span><strong>{run.activity}…</strong></span>
          </li>
        )}
      </ol>

      {run.status === 'found' && (
        <div className="contact-result">
          <a className="contact-email" href={`mailto:${contact.email}`}><Icon name="mail" size={15} /> {contact.email}</a>
          {contact.note && <p>{contact.note}</p>}
          <p>
            On <a href={contact.sourceUrl} target="_blank" rel="noreferrer">{hostOf(contact.sourceUrl)}</a>, next to “{contact.evidence}”
          </p>
        </div>
      )}
      {run.status === 'not-found' && (
        <p className="agent-note">
          <Icon name="help" size={15} />
          <span>
            {run.reason}
            {run.contactPage && <> <a href={run.contactPage} target="_blank" rel="noreferrer">Open their contact form</a></>}
          </span>
        </p>
      )}
      {run.status === 'failed' && <p className="agent-note" role="alert"><Icon name="close" size={15} /> {run.error}</p>}

      {!working && (
        <div className="agent-run-foot">
          <span className="muted">{run.status === 'found' && 'Found by Gemini on the open web. Check it before sending.'}</span>
          <button className="text-button" onClick={onRetry}>Search again</button>
        </div>
      )}
      <span ref={end} />
    </div>
  )
}

import { join } from 'node:path'
import express from 'express'
import { Firestore } from '@google-cloud/firestore'
import { GoogleGenAI } from '@google/genai'
import { agents } from './agents.js'

// On Cloud Run these authenticate as the service's runtime service account.
const db = new Firestore()
const ai = new GoogleGenAI({ enterprise: true, project: process.env.GOOGLE_CLOUD_PROJECT ?? 'ruthai26nyc-2612', location: 'global' })
const model = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash'
const app = express()

// Express 5 forwards a rejected promise to the default error handler.
app.get('/api/restaurants', async (req, res) => {
  const [meta, restaurants] = await Promise.all([
    db.doc('meta/oysterDataset').get(),
    db.collection('restaurants').get(),
  ])
  res.set('Cache-Control', 'public, max-age=60')
  res.json({
    title: meta.get('title'),
    source: meta.get('source'),
    mock: meta.get('mock') ?? false,
    checkedWithoutOysters: meta.get('checkedWithoutOysters') ?? [],
    restaurants: restaurants.docs.map((doc) => doc.data()),
  })
})

// Only text, tool calls and tool results are passed on to Gemini. Anything else, such as
// fileData naming a gs:// file, would be read with the service account's access.
const partFields = {
  text: null,
  thought: null,
  thoughtSignature: null,
  functionCall: ['id', 'name', 'args'],
  functionResponse: ['id', 'name', 'response'],
}

function isAllowedPart(part) {
  return typeof part === 'object' && part !== null && Object.entries(part).every(([key, value]) => {
    if (!Object.hasOwn(partFields, key)) return false
    const fields = partFields[key]
    return !fields || (typeof value === 'object' && value !== null && Object.keys(value).every((field) => fields.includes(field)))
  })
}

function isConversation(contents) {
  return Array.isArray(contents) && contents.length > 0 && contents.length <= 30 && contents.every((message) =>
    (message?.role === 'user' || message?.role === 'model') && Array.isArray(message.parts) && message.parts.length > 0 && message.parts.every(isAllowedPart))
}

// One Gemini turn for a named agent in agents.js. The browser runs any tools the
// model calls and posts the conversation again with their results (src/agent.js).
app.post('/api/agent/:name', express.json({ limit: '64kb' }), async (req, res) => {
  const { name } = req.params
  const agent = Object.hasOwn(agents, name) ? agents[name] : null
  if (!agent) return res.status(404).json({ error: `No agent named “${name}”.` })
  const contents = req.body?.contents
  if (!isConversation(contents)) {
    return res.status(400).json({ error: 'Send 1 to 30 messages made of text, tool calls and tool results.' })
  }
  const response = await ai.models.generateContent({
    model,
    contents,
    config: { ...agent, httpOptions: { timeout: 30_000, retryOptions: { attempts: 2 } } },
  })
  const [candidate] = response.candidates ?? []
  if (!candidate?.content?.parts?.length) {
    return res.status(502).json({ error: `Gemini returned no answer (${candidate?.finishReason ?? 'no candidates'}).` })
  }
  res.json({ model, content: candidate.content })
})

// API errors as JSON, keeping the status of bad requests and of Gemini's own errors.
app.use('/api', (err, req, res, _next) => {
  console.error(err)
  res.status(err.status >= 400 && err.status < 600 ? err.status : 500).json({ error: errorMessage(err) })
})

// Gemini's errors carry the API's whole JSON error body as their message.
function errorMessage(err) {
  try {
    return JSON.parse(err.message).error?.message ?? err.message
  } catch {
    return err.message
  }
}

app.use(express.static(join(import.meta.dirname, '../dist')))
// The customer prototype is a client-side route served by the same index.html.
app.get('/customer', (req, res) => res.sendFile(join(import.meta.dirname, '../dist/index.html')))

const port = process.env.PORT ?? 8080
app.listen(port, () => console.log(`Listening on :${port}`))

// Runs the Gemini agents defined in server/agents.js. The server makes one model
// call per request. This loop runs the tools the model asks for here, where the
// restaurant's data and the page are, and sends back their results until done.

async function callAgent(name, contents, signal) {
  const res = await fetch(`/api/agent/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
    signal,
  }).catch((err) => {
    throw signal?.aborted ? err : new Error('Couldn’t reach the GoodRiddance server. Check your connection.')
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
  return body
}

// `tools` maps each tool's name to a function of the call's args that returns its
// result. A result of { error } lets the model correct itself; one with `done: true`
// ends the run. `onCall` sees each call with its result, in order.
export async function runAgent({ name, prompt, tools, onCall, signal, maxTurns = 16 }) {
  const contents = [{ role: 'user', parts: [{ text: prompt }] }]
  for (let turn = 0; turn < maxTurns; turn++) {
    const { model, content } = await callAgent(name, contents, signal)
    signal?.throwIfAborted()
    // Sent back exactly as received: Gemini 3 needs the thought signatures in it.
    contents.push(content)
    const calls = content.parts.filter((part) => part.functionCall).map((part) => part.functionCall)
    if (!calls.length) throw new Error('The agent stopped without finishing.')

    let done = false
    const results = calls.map(({ id, name: tool, args = {} }) => {
      const result = Object.hasOwn(tools, tool) ? tools[tool](args) : { error: `There is no tool named ${tool}.` }
      done ||= result.done === true
      onCall?.({ name: tool, args, result, model })
      return { functionResponse: { ...(id && { id }), name: tool, response: result } }
    })
    if (done) return
    contents.push({ role: 'user', parts: results })
  }
  throw new Error(`The agent didn’t finish in ${maxTurns} turns.`)
}

// One call to an agent that answers in JSON, such as a drafted email.
export async function askAgent(name, prompt, signal) {
  const { model, content } = await callAgent(name, [{ role: 'user', parts: [{ text: prompt }] }], signal)
  const text = content.parts.filter((part) => part.text && !part.thought).map((part) => part.text).join('')
  return { model, ...JSON.parse(text) }
}

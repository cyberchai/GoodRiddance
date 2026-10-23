import { useCallback, useRef, useState } from 'react'
import { runAgent } from './agent'
import { recordings } from './agentRecordings'
import { prefersReducedMotion } from './Analytics'
import { eligibility } from './opportunities'
import { bop, carriers, formatDate, oysterItems, oystersPerShell, pickupHistory, restaurant, shellTotals, weeklyShells } from './shellData'

const stepGap = 350 // ms between steps on screen
const typingTime = 700 // ms to type out one field

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length
}

// The tools the `apply` agent calls (declared in server/agents.js) for one application.
function applicationTools(o) {
  const filled = {}
  const fieldsLeft = () => o.form.fields.filter((f) => !filled[f.id]).map((f) => f.id)
  return {
    read_application: () => ({
      program: o.name,
      kind: o.kind,
      url: o.url,
      deadline: o.deadline ?? 'none listed',
      about: o.about,
      eligibility: { note: 'GoodRiddance’s own quick check, not the program’s official rules.', criteria: eligibility(o) },
      fields: o.form.fields,
    }),
    read_restaurant_profile: () => ({
      name: restaurant.name,
      address: `${restaurant.street}, ${restaurant.city}, ${restaurant.state} ${restaurant.zip}`,
      hours: restaurant.hours,
      merchantAccount: { name: restaurant.manager, role: restaurant.role, email: restaurant.email, phone: restaurant.phone },
      oysterDishes: oysterItems.map(({ name, detail, price, shellsPerWeek }) => ({ name, detail, price, shellsPerWeek })),
      shellsPerWeek: restaurant.oystersPerWeek,
      recyclingPartner: bop.name,
    }),
    read_shell_records: () => {
      const totals = shellTotals(weeklyShells)
      return {
        period: `The 12 weeks starting ${formatDate(weeklyShells[0].weekOf, { month: 'long', day: 'numeric', year: 'numeric' })}`,
        totals: { ...totals, tons: Number((totals.lb / 2000).toFixed(1)) },
        oysterHomes: `Each shell can hold ${oystersPerShell.join('–')} baby oysters on a new reef; oysterHomes uses the low end.`,
        weeklyLb: weeklyShells.map((w) => ({ weekOf: w.weekOf, lb: w.lb })),
        receipts: pickupHistory.map((p) => ({ receipt: p.receipt, date: p.date, lb: p.lb, pickedUpBy: carriers[p.carrier].short })),
        whereShellsGo: `${bop.dropoff}, then ${bop.curing} to cure before going back into New York Harbor.`,
      }
    },
    fill_field: ({ field_id: id, value }) => {
      const field = o.form.fields.find((f) => f.id === id)
      const text = String(value ?? '').trim()
      if (!field) return { error: `There is no field “${id}”. The fields are: ${o.form.fields.map((f) => f.id).join(', ')}.` }
      if (!text) return { error: 'The value is empty.' }
      if (/\[[^\]]*\]/.test(text)) return { error: 'Don’t leave placeholders in brackets. The restaurant profile has the owner’s name, email and phone, and the opening hours.' }
      if (field.options && !field.options.includes(text)) return { error: `Choose exactly one of: ${field.options.join('; ')}.` }
      if (field.maxWords && wordCount(text) > field.maxWords) return { error: `That is ${wordCount(text)} words; the limit is ${field.maxWords}. Shorten it.` }
      filled[id] = text
      return { ok: true, fieldsLeft: fieldsLeft() }
    },
    submit_for_review: ({ note }) => {
      const left = fieldsLeft()
      if (left.length) return { error: `Fill these fields first: ${left.join(', ')}.` }
      return { done: true, note: String(note ?? '') }
    },
  }
}

// The timeline line for one tool call.
function stepFor(o, { name, args, result }) {
  const fieldLabel = o.form.fields.find((f) => f.id === args.field_id)?.label ?? args.field_id
  if (result.error) {
    return { tone: 'fix', label: name === 'fill_field' ? `Revising “${fieldLabel}”` : 'Checking the form', detail: result.error }
  }
  switch (name) {
    case 'read_application':
      return { label: 'Checked eligibility', detail: result.eligibility.criteria.map((c) => c.evidence ?? `Not met: ${c.label}`).join(' · ') }
    case 'read_restaurant_profile':
      return { label: 'Read your restaurant profile', detail: `${result.name} · ${result.oysterDishes.length} oyster dishes` }
    case 'read_shell_records':
      return { label: 'Read 12 weeks of shell pickups', detail: `${result.totals.lb.toLocaleString()} lb · ${result.totals.pickups} pickups · ${result.receipts.length} receipts` }
    case 'fill_field':
      return { label: `Filled “${fieldLabel}”`, detail: args.source }
    case 'submit_for_review':
      return { label: 'Draft ready for your review' }
    default:
      return { label: name }
  }
}

// Gemini often makes several calls at once. This plays them back one at a time,
// typing each field's value, so people can follow what the agent did.
function presenter(o, signal, update) {
  const instant = prefersReducedMotion()
  const wait = (ms) => (instant ? null : new Promise((resolve) => setTimeout(resolve, ms)))
  let shown = Promise.resolve()

  async function present(call) {
    const { name, args, result } = call
    const step = stepFor(o, call)
    const id = args.field_id
    const field = name === 'fill_field' && !result.error ? { value: String(args.value).trim(), source: args.source } : null
    if (field && !instant) {
      const frames = Math.min(24, field.value.length)
      update({ activeField: id })
      for (let i = 1; i <= frames && !signal.aborted; i++) {
        const partial = field.value.slice(0, Math.ceil((field.value.length * i) / frames))
        update((d) => ({ fields: { ...d.fields, [id]: { ...field, value: partial } } }))
        await wait(typingTime / frames)
      }
    }
    if (signal.aborted) return
    update((d) => ({
      model: call.model ?? d.model,
      steps: [...d.steps, step],
      activeField: null,
      ...(field && { fields: { ...d.fields, [id]: field } }),
      ...(result.done && { note: result.note }),
    }))
    await wait(stepGap)
  }

  return {
    show: (call) => { shown = shown.then(() => !signal.aborted && present(call)) },
    finished: () => shown,
  }
}

const emptyDraft = { steps: [], fields: {}, activeField: null, note: '', error: '', model: '' }

// Gemini drafts of the ready applications, kept in App so a run carries on while
// the owner looks at other pages. `draftAll` queues them one at a time.
export function useGrantDrafts() {
  const [drafts, setDrafts] = useState({})
  const controllers = useRef({})
  const stopped = useRef(new Set())
  const queued = useRef(new Set())
  const queue = useRef(Promise.resolve())

  const update = useCallback((id, changes) => setDrafts((all) => ({
    ...all,
    [id]: { ...all[id], ...(typeof changes === 'function' ? changes(all[id]) : changes) },
  })), [])

  const draft = useCallback(async (o, { recorded = false } = {}) => {
    if (stopped.current.has(o.id)) return
    controllers.current[o.id]?.abort()
    const controller = new AbortController()
    controllers.current[o.id] = controller
    const { signal } = controller
    // Updates from a run that was redone or stopped are dropped.
    const updateDraft = (changes) => !signal.aborted && update(o.id, changes)
    const screen = presenter(o, signal, updateDraft)
    const tools = applicationTools(o)
    const calls = []
    let model = ''
    setDrafts((all) => ({ ...all, [o.id]: { ...emptyDraft, status: 'working', recorded } }))

    try {
      if (recorded) {
        const recording = recordings[o.id]
        for (const { name, args } of recording.calls) screen.show({ name, args, result: tools[name](args), model: recording.model })
      } else {
        await runAgent({
          name: 'apply',
          prompt: `Draft the ${o.name} application (${o.detail}) for ${restaurant.name}.`,
          tools,
          signal,
          onCall: (call) => {
            model = call.model
            calls.push({ name: call.name, args: call.args })
            screen.show(call)
          },
        })
      }
      await screen.finished()
      if (signal.aborted) return
      updateDraft({ status: 'ready' })
      // Paste into src/agentRecordings.js to refresh the offline fallback.
      if (import.meta.env.DEV && !recorded) console.info(`[agent] recording ${o.id}`, JSON.stringify({ model, calls }))
    } catch (err) {
      if (signal.aborted) return
      await screen.finished()
      updateDraft({ status: 'failed', activeField: null, error: err.message })
    }
  }, [update])

  const draftAll = useCallback((list) => {
    for (const o of list) {
      if (queued.current.has(o.id)) continue
      queued.current.add(o.id)
      setDrafts((all) => ({ ...all, [o.id]: { ...emptyDraft, status: 'queued' } }))
      queue.current = queue.current.then(() => draft(o))
    }
  }, [draft])

  const stop = useCallback((id) => {
    stopped.current.add(id)
    controllers.current[id]?.abort()
  }, [])

  const editField = useCallback((id, fieldId, value) => {
    update(id, (d) => ({ fields: { ...d.fields, [fieldId]: { ...d.fields[fieldId], value } } }))
  }, [update])

  return {
    drafts,
    draftAll,
    stop,
    editField,
    redo: (o) => draft(o),
    replay: (o) => draft(o, { recorded: true }),
    hasRecording: (id) => Object.hasOwn(recordings, id),
  }
}

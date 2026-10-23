import Icon from './Icon'

const statusLabels = { queued: 'Queued', working: 'Working', ready: 'Ready for review', failed: 'Stopped' }

// "gemini-3.8-flash" → "Gemini 3.8 Flash"
function modelName(id) {
  return id.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')
}

// What the agent is doing right now, for a row's status line and the timeline.
export function draftProgress(opportunity, draft) {
  const total = opportunity.form.fields.length
  const filled = opportunity.form.fields.filter((f) => draft?.fields[f.id]).length
  switch (draft?.status) {
    case 'queued': return 'Gemini will draft this next'
    case 'working': return `Gemini is drafting · ${filled} of ${total} fields`
    case 'ready': return `Drafted by Gemini · ${total} fields to review`
    case 'failed': return 'The agent stopped before finishing'
    default: return 'Not eligible yet'
  }
}

// The timeline's last line while the agent is busy.
function pendingStep(o, draft) {
  if (draft.status === 'queued') return 'Waiting for the other draft'
  const active = o.form.fields.find((f) => f.id === draft.activeField)
  return active ? `Filling “${active.label}”` : 'Thinking…'
}

// Until the draft is ready a select shows as text, so the agent can be seen typing into it.
function fieldInput(f, editable, props) {
  if (f.type === 'textarea') return <textarea rows={f.maxWords > 100 ? 5 : 3} {...props} />
  if (f.type === 'select' && editable) return <select {...props}>{f.options.map((option) => <option key={option}>{option}</option>)}</select>
  return <input {...props} />
}

// The Gemini agent's workspace for one application: the steps it took on the left
// and the form it is filling on the right. Fields are editable once it's done.
export default function AgentRun({ opportunity: o, draft, onEdit, onRedo, onReplay, canReplay }) {
  const editable = draft.status === 'ready'
  const busy = draft.status === 'working' || draft.status === 'queued'

  return (
    <div className="agent-run">
      <div className="agent-run-head">
        <span className="agent-name"><Icon name="sparkles" size={16} /> Gemini agent</span>
        {draft.recorded ? <span className="chip">Recorded run, not live</span> : draft.model && <span className="muted">{modelName(draft.model)} · live</span>}
        <span className={`agent-status ${draft.status}`}>{statusLabels[draft.status]}</span>
      </div>

      <div className="agent-run-body">
        <ol className="agent-steps" aria-label="What the agent did">
          {draft.steps.map((step, i) => (
            <li key={i} className={step.tone}>
              <Icon name={step.tone === 'fix' ? 'edit' : 'check'} size={14} />
              <span><strong>{step.label}</strong>{step.detail && <small>{step.detail}</small>}</span>
            </li>
          ))}
          {busy && (
            <li className="pending" aria-live="polite">
              <span className="agent-pulse" />
              <span><strong>{pendingStep(o, draft)}</strong></span>
            </li>
          )}
          {draft.status === 'failed' && (
            <li className="failed" role="alert">
              <Icon name="close" size={14} />
              <span><strong>Stopped</strong><small>{draft.error}</small></span>
            </li>
          )}
        </ol>

        <form className="agent-form" onSubmit={(e) => e.preventDefault()} aria-label={`${o.name} application`}>
          {o.form.fields.map((f) => {
            const field = draft.fields[f.id]
            const props = {
              value: field?.value ?? '',
              readOnly: !editable,
              placeholder: busy ? 'The agent will fill this' : '',
              onChange: (e) => onEdit(f.id, e.target.value),
            }
            return (
              <label key={f.id} className={draft.activeField === f.id ? 'filling' : ''}>
                {f.label}
                {fieldInput(f, editable, props)}
                {field?.source && <span className="source-chip"><Icon name="receipt" size={12} /> {field.source}</span>}
              </label>
            )
          })}
        </form>
      </div>

      {draft.note && <p className="agent-note"><Icon name="sparkles" size={15} /> {draft.note}</p>}
      <div className="agent-run-foot">
        <span className="muted">Nothing is sent until you approve. Eligibility uses GoodRiddance’s sample rules.</span>
        {!busy && (
          <span className="agent-run-actions">
            {draft.status === 'failed' && canReplay && <button className="button secondary small" onClick={onReplay}>Play recorded run</button>}
            <button className="button secondary small" onClick={onRedo}>{draft.status === 'failed' ? 'Try again' : 'Redo draft'}</button>
          </span>
        )}
      </div>
    </div>
  )
}

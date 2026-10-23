import { useEffect, useState } from 'react'
import Icon from './Icon'
import { assess, draftApplication, programs } from './grantPrograms'
import { restaurant } from './shellData'

const agentSteps = [
  `Read the restaurant profile: ${restaurant.name}, ${restaurant.city}, ${restaurant.state}`,
  `Searched ${programs.length} oyster-shell grant and incentive programs`,
  'Checked each program against your location and who is allowed to apply',
  'Filled in the application for each program you can pursue',
]

function stepClass(index, progress) {
  if (index < progress) return 'done'
  if (index === progress) return 'active'
  return ''
}

export default function Grants({ decisions, onDecide }) {
  const [progress, setProgress] = useState(agentSteps.length)
  const running = progress < agentSteps.length
  useEffect(() => {
    if (!running) return
    const timer = setTimeout(() => setProgress((p) => p + 1), 700)
    return () => clearTimeout(timer)
  }, [progress, running])

  const results = programs.map((program) => ({ program, assessment: assess(program, restaurant) }))
  const eligible = results.filter((r) => r.assessment.eligible)
  const ruledOut = results.filter((r) => !r.assessment.eligible)

  return (
    <>
      <section className="card agent">
        <div className="card-heading">
          <div className="agent-title">
            <span className="agent-icon"><Icon name="sparkles" size={20} /></span>
            <div><h2>Gemini grant agent</h2><p className="muted">Simulated. Nothing is submitted without your approval.</p></div>
          </div>
          <button className="button secondary" onClick={() => setProgress(0)} disabled={running}>
            <Icon name="sparkles" size={15} /> {running ? 'Searching…' : 'Run again'}
          </button>
        </div>
        <ol className="agent-steps">
          {agentSteps.map((step, i) => (
            <li key={step} className={stepClass(i, progress)}>
              <Icon name={i < progress ? 'check' : 'clock'} size={14} /> {step}
            </li>
          ))}
        </ol>
        {!running && <p className="agent-summary">
          <strong>{eligible.length} {eligible.length === 1 ? 'program' : 'programs'} you can pursue</strong> · {ruledOut.length} ruled out by location
        </p>}
      </section>

      {!running && <>
        {eligible.map(({ program, assessment }) => (
          <GrantCard key={program.id} program={program} assessment={assessment} decision={decisions[program.id]} onDecide={onDecide} />
        ))}

        <section className="card">
          <h2>Ruled out</h2>
          <ul className="ruled-out">
            {ruledOut.map(({ program, assessment }) => (
              <li key={program.id}>
                <span className="chip muted-chip">Not eligible</span>
                <div>
                  <strong>{program.name}</strong>
                  <p>{assessment.reason} {program.kind}: {program.award}.</p>
                  <ProgramLinks program={program} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </>}
    </>
  )
}

function GrantCard({ program, assessment, decision, onDecide }) {
  const draft = draftApplication(program, restaurant, assessment)
  return (
    <section className="card grant">
      <div className="card-heading">
        <div>
          <div className="chips">
            <span className="chip eligible-chip"><Icon name="check" size={12} /> Eligible</span>
            {assessment.viaPartner && <span className="chip">Applied for by BOP</span>}
            {assessment.deadlinePassed && <span className="chip warn-chip">Deadline passed</span>}
          </div>
          <h2>{program.name}</h2>
          <p className="muted">{assessment.reason}</p>
        </div>
      </div>

      <dl className="facts">
        <div><dt>{program.kind}</dt><dd>{program.award}</dd></div>
        <div><dt>How it works</dt><dd>{program.howToApply}</dd></div>
      </dl>

      <div className="draft">
        <div className="draft-heading">
          <strong><Icon name="sparkles" size={14} /> Application drafted by the agent</strong>
          <span className="muted">Send to: {draft.sendTo}</span>
        </div>
        <dl>{draft.fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <p className="draft-timing"><Icon name="clock" size={14} /> {draft.timing}</p>
      </div>

      <Decision program={program} decision={decision} sendTo={draft.sendTo} deadlinePassed={assessment.deadlinePassed} onDecide={onDecide} />

      <ProgramLinks program={program} />
    </section>
  )
}

function Decision({ program, decision, sendTo, deadlinePassed, onDecide }) {
  if (decision === 'approved') {
    return (
      <div className="decision approved">
        <Icon name="check" size={16} />
        <span><strong>Approved by {restaurant.manager}.</strong> Queued for {sendTo}. Nothing was sent (mock).</span>
        <button className="text-button" onClick={() => onDecide(program, undefined)}>Undo</button>
      </div>
    )
  }
  if (decision === 'declined') {
    return (
      <div className="decision">
        <span>Skipped for now.</span>
        <button className="text-button" onClick={() => onDecide(program, undefined)}>Review again</button>
      </div>
    )
  }
  return (
    <div className="decision-actions">
      <button className="button primary" onClick={() => onDecide(program, 'approved')}>
        <Icon name="check" size={16} /> {deadlinePassed ? 'Approve for next round' : 'Approve and send'}
      </button>
      <button className="button secondary" onClick={() => onDecide(program, 'declined')}>Not now</button>
    </div>
  )
}

function ProgramLinks({ program }) {
  return (
    <p className="program-links">
      {program.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} <Icon name="arrow" size={12} /></a>)}
    </p>
  )
}

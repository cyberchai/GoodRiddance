import { useState } from 'react'
import AgentRun, { draftProgress } from './AgentRun'
import Icon from './Icon'
import { opportunities } from './opportunities'

export default function Grants({ decisions, onDecide, agent }) {
  const { drafts } = agent
  const waiting = opportunities.filter((o) => o.status === 'ready' && !decisions[o.id])
  const sent = opportunities.filter((o) => o.status !== 'ready' || decisions[o.id] === 'approved')
  // Until the owner opens or closes a draft, show the one the agent is working on.
  const [openId, setOpenId] = useState()
  const shownId = openId === undefined ? waiting.find((o) => drafts[o.id]?.status === 'working')?.id : openId

  return (
    <>
      <section className="card">
        <h2>Waiting for your approval</h2>
        {waiting.length ? (
          <ul className="opportunities drafts">
            {waiting.map((o) => {
              const draft = drafts[o.id]
              const open = Boolean(draft) && shownId === o.id
              return (
                <li key={o.id}>
                  <div className="opportunity-row">
                    <div>
                      <Opportunity opportunity={o} />
                      <p className={`draft-progress ${draft?.status ?? 'none'}`}><Icon name="sparkles" size={13} /> {draftProgress(o, draft)}</p>
                    </div>
                    <div className="decision-actions">
                      {draft && (
                        <button className="button secondary small" aria-expanded={open} onClick={() => setOpenId(open ? null : o.id)}>
                          {open ? 'Hide' : draft.status === 'ready' ? 'Review draft' : 'Watch'}
                        </button>
                      )}
                      <button className="button primary small" disabled={draft?.status !== 'ready'} onClick={() => onDecide(o, 'approved')}><Icon name="check" size={15} /> Approve</button>
                      <button className="button secondary small" onClick={() => onDecide(o, 'declined')}>Skip</button>
                    </div>
                  </div>
                  {open && (
                    <AgentRun
                      opportunity={o}
                      draft={draft}
                      onEdit={(fieldId, value) => agent.editField(o.id, fieldId, value)}
                      onRedo={() => agent.redo(o)}
                      onReplay={() => agent.replay(o)}
                      canReplay={agent.hasRecording(o.id)}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        ) : <p className="muted">You’re all caught up.</p>}
      </section>

      <section className="card">
        <h2>Sent</h2>
        <ul className="opportunities">
          {sent.map((o) => (
            <li key={o.id}>
              <Opportunity opportunity={o} />
              <span className="chip eligible-chip"><Icon name="check" size={12} /> {o.status === 'ready' ? 'Submitted' : o.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function Opportunity({ opportunity: o }) {
  return (
    <div className="opportunity">
      <a href={o.url} target="_blank" rel="noreferrer"><strong>{o.name}</strong></a> <span className={`chip kind-${o.kind.toLowerCase()}`}>{o.kind}</span>
      <p className="muted">{o.detail}</p>
    </div>
  )
}

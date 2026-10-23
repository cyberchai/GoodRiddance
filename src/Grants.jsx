import Icon from './Icon'
import { opportunities } from './opportunities'

export default function Grants({ decisions, onDecide }) {
  const waiting = opportunities.filter((o) => o.status === 'ready' && !decisions[o.id])
  const sent = opportunities.filter((o) => o.status !== 'ready' || decisions[o.id] === 'approved')

  return (
    <>
      <section className="card">
        <h2>Waiting for your approval</h2>
        {waiting.length ? (
          <ul className="opportunities">
            {waiting.map((o) => (
              <li key={o.id}>
                <Opportunity opportunity={o} />
                <div className="decision-actions">
                  <button className="button primary small" onClick={() => onDecide(o, 'approved')}><Icon name="check" size={15} /> Approve</button>
                  <button className="button secondary small" onClick={() => onDecide(o, 'declined')}>Skip</button>
                </div>
              </li>
            ))}
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
      <a href={o.url} target="_blank" rel="noreferrer"><strong>{o.name}</strong></a> <span className="chip">{o.kind}</span>
      <p className="muted">{o.detail}</p>
    </div>
  )
}

import { useState } from 'react'
import Icon from './Icon'
import { formatDate, partners, pickupHistory, weeklyLb } from './wasteData'

// The Recurring pickup page: one card per scheduled pickup, plus past pickups.
export default function RecurringPickup({ pickups, items, onNew, onEdit, onSkip, onTogglePause }) {
  const [tab, setTab] = useState('Scheduled')

  return <>
    <section className="pickup-intro">
      <span className="banner-icon"><Icon name="calendar" size={28}/></span>
      <div><h2>A little planning goes a long way.</h2><p>Set up a pickup for each material. Pickups are saved on this device.</p></div>
      <span className="sample-label">LOCAL PROTOTYPE</span>
    </section>

    <div className="menu-toolbar">
      <div className="tabs">{[['Scheduled', pickups.length], ['History', pickupHistory.length]].map(([name, count]) =>
        <button key={name} className={tab === name ? 'selected' : ''} onClick={() => setTab(name)}>{name}<span>{count}</span></button>)}</div>
      <button className="gr-button" onClick={onNew}><Icon name="plus" size={16}/> New pickup</button>
    </div>

    {tab === 'Scheduled' && (pickups.length
      ? <div className="pickup-grid">{pickups.map(p => <PickupCard key={p.id} pickup={p} items={items} onEdit={() => onEdit(p)} onSkip={() => onSkip(p)} onTogglePause={() => onTogglePause(p)}/>)}</div>
      : <div className="empty-state"><Icon name="calendar" size={32}/><h2>No pickups yet</h2><p>Start one from a dish’s waste details, or here.</p><button className="gr-button" onClick={onNew}>New pickup</button></div>)}

    {tab === 'History' && <section className="panel history-panel">
      <div className="panel-heading"><div><h2>Past pickups</h2><p>Sample data · weights reported by the partner</p></div></div>
      <div className="table-scroll">
        <table className="history-table">
          <thead><tr><th>Date</th><th>Partner</th><th>Material</th><th className="num">Weight (lb)</th><th>Status</th><th>Driver</th></tr></thead>
          <tbody>{pickupHistory.map(row => <tr key={row.date}>
            <td>{formatDate(row.date)}</td>
            <td>{partners[row.partnerId].name}</td>
            <td>{row.material}</td>
            <td className="num">{row.lb == null ? '—' : row.lb.toFixed(1)}</td>
            <td><span className={`status-chip ${row.status === 'Skipped' ? 'paused' : 'active'}`}>{row.status}</span></td>
            <td>{row.driver ?? '—'}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>}
  </>
}

function PickupCard({ pickup, items, onEdit, onSkip, onTogglePause }) {
  const partner = partners[pickup.partnerId]
  const paused = pickup.status === 'paused'
  const lb = weeklyLb(items, pickup.material)
  const containers = `${pickup.containers} ${partner.container}${pickup.containers === 1 ? '' : 's'}`

  return <article className={`panel pickup-card ${paused ? 'is-paused' : ''}`}>
    <div className="pickup-card-head">
      <span className="partner-logo">{partner.initials}</span>
      <div><strong>{partner.name}</strong><small>{partner.type}</small></div>
      <span className={`status-chip ${pickup.status}`}>{paused ? 'Paused' : 'Active'}</span>
    </div>
    <dl className="waste-facts compact">
      <div><dt>Material</dt><dd>{pickup.material}</dd></div>
      <div><dt>Schedule</dt><dd>{pickup.frequency} · {pickup.days.join(', ')} · {pickup.window}</dd></div>
      <div><dt>Containers</dt><dd>{containers}</dd></div>
      <div><dt>Next pickup</dt><dd>{paused ? 'Paused' : `${formatDate(pickup.nextPickup)}, ${pickup.window}`}</dd></div>
      {lb > 0 && <div><dt>Amount</dt><dd>About {Math.round(lb)} lb a week <span className="estimate-tag">Estimated</span></dd></div>}
    </dl>
    <p className="drive-line"><Icon name="truck" size={16}/> Delivered with DoorDash Drive</p>
    <div className="pickup-card-actions">
      <button className="secondary-button" onClick={onEdit}><Icon name="edit" size={14}/> Edit</button>
      <button className="secondary-button" onClick={onSkip} disabled={paused}>Skip next</button>
      <button className="secondary-button" onClick={onTogglePause}>{paused ? 'Resume' : 'Pause'}</button>
    </div>
  </article>
}

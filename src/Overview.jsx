import Icon from './Icon'
import { bop, carriers, daysAgo, formatDate, journey, lbPerShell, oystersPerShell, pickupHistory, restaurant, upcomingPickups } from './shellData'

export default function Overview({ schedule, pendingGrants }) {
  const [next] = upcomingPickups(schedule.days, 1)
  const since = daysAgo(30)
  const recent = pickupHistory.filter((p) => p.date >= since)
  const recycledLb = recent.reduce((sum, p) => sum + p.lb, 0)
  const shellsPerYear = restaurant.oystersPerWeek * 52
  const [low, high] = oystersPerShell.map((n) => (shellsPerYear * n).toLocaleString())

  return (
    <>
      <div className="stats">
        <Stat label="Shells a week" value={restaurant.oystersPerWeek.toLocaleString()}
          note={`About ${Math.round(restaurant.oystersPerWeek * lbPerShell)} lb · estimated`} />
        <Stat label="Recycled, last 30 days" value={`${recycledLb} lb`}
          note={`${recent.length} pickups · sample data`} />
        <Stat label="Next pickup" value={next ? formatDate(next) : 'None'}
          note={`${schedule.window} · ${carriers[schedule.carrier].short}`} href="#pickups" />
        <Stat label="Grants to review" value={pendingGrants}
          note={pendingGrants ? 'Drafted by the agent' : 'All caught up'} href="#grants" highlight={pendingGrants > 0} />
      </div>

      <section className="card">
        <div className="card-heading">
          <h2>From your kitchen to the harbor</h2>
          <a className="text-link" href={bop.url} target="_blank" rel="noreferrer">How BOP’s shell program works <Icon name="arrow" size={13} /></a>
        </div>
        <ol className="journey">
          {journey.map((step, i) => (
            <li key={step.title}>
              <span className="journey-icon"><Icon name={step.icon} size={20} /></span>
              <strong>{i + 1}. {step.title}</strong>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="impact-line">
          <Icon name="shore" size={18} /> Each shell can become home for {oystersPerShell.join('–')} new oysters.
          At your pace, that’s about {low}–{high} oysters a year.
        </p>
      </section>

      <section className="card">
        <div className="card-heading">
          <h2>Oysters on your menu</h2>
          <span className="muted">From your DoorDash menu</span>
        </div>
        <ul className="menu-list">
          {restaurant.oysterItems.map((item) => (
            <li key={item.name}>
              <span><strong>{item.name}</strong><small>{item.detail}</small></span>
              <span className="price">${item.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function Stat({ label, value, note, href, highlight }) {
  const body = (
    <>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-note">{note}</span>
    </>
  )
  if (!href) return <div className="stat card">{body}</div>
  return (
    <a className={`stat card ${highlight ? 'highlight' : ''}`} href={href}>
      {body}
      <Icon name="arrow" size={16} className="stat-arrow" />
    </a>
  )
}

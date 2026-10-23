import { useState } from 'react'
import Icon from './Icon'
import { carriers, dasherLbPerPickup, formatDate, lbPerShell, oysterItems, oystersPerShell, restaurant, upcomingPickups, weeklyShells } from './shellData'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export default function Analytics({ schedule }) {
  const [nextPickup] = upcomingPickups(schedule.days, 1)
  const totalLb = weeklyShells.reduce((sum, w) => sum + w.lb, 0)
  const pickups = weeklyShells.reduce((sum, w) => sum + w.pickups, 0)
  const dasherPickups = weeklyShells.reduce((sum, w) => sum + w.dasher, 0)
  const shells = Math.round(totalLb / lbPerShell)
  const dasherLb = dasherPickups * dasherLbPerPickup
  const byCarrier = [
    { id: 'bop', pickups: pickups - dasherPickups, lb: totalLb - dasherLb },
    { id: 'dasher', pickups: dasherPickups, lb: dasherLb },
  ]

  return (
    <>
      <p className="sample-note">Sample data · last 12 full weeks</p>
      <div className="stats">
        <Stat label="Shells a week" value={restaurant.oystersPerWeek.toLocaleString()}
          note={`About ${Math.round(restaurant.oystersPerWeek * lbPerShell)} lb · estimated from your menu`} />
        <Stat label="Shells recycled" value={`${totalLb.toLocaleString()} lb`}
          note={`About ${shells.toLocaleString()} shells · ${(totalLb / 2000).toFixed(1)} tons kept out of landfill`} />
        <Stat label="Pickups completed" value={pickups} href="#pickups"
          note={`${dasherPickups} by Dashers${nextPickup ? ` · next ${formatDate(nextPickup)}` : ''}`} />
        <Stat label="Future oysters" value={oystersPerShell.map((n) => compact.format(shells * n)).join('–')}
          note={`At ${oystersPerShell.join('–')} per shell`} />
      </div>

      <section className="card">
        <div className="card-heading">
          <div><h2>Shells recycled each week</h2><p className="muted">Pounds weighed at BOP’s transfer station</p></div>
        </div>
        <WeeklyChart weeks={weeklyShells} />
        <details className="table-view">
          <summary>Show as table</summary>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Week of</th><th className="num">Shells (lb)</th><th className="num">Pickups</th><th className="num">By Dasher</th></tr></thead>
              <tbody>
                {weeklyShells.map((w) => (
                  <tr key={w.weekOf}><td>{formatDate(w.weekOf)}</td><td className="num">{w.lb}</td><td className="num">{w.pickups}</td><td className="num">{w.dasher}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <div className="analytics-row">
        <section className="card">
          <h2>Where your shells come from</h2>
          <p className="muted">Shells a week by menu item · estimated</p>
          <BarList rows={oysterItems.map((item) => ({ label: item.name, value: item.shellsPerWeek, display: `${item.shellsPerWeek.toLocaleString()} shells` }))} />
        </section>
        <section className="card">
          <h2>Who picked them up</h2>
          <p className="muted">Pounds delivered to BOP, last 12 weeks</p>
          <BarList rows={byCarrier.map((c) => ({ label: carriers[c.id].name, value: c.lb, display: `${c.lb.toLocaleString()} lb · ${c.pickups} pickups` }))} />
        </section>
      </div>
    </>
  )
}

function Stat({ label, value, note, href }) {
  const body = (
    <>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-note">{note}</span>
    </>
  )
  if (!href) return <div className="stat card">{body}</div>
  return (
    <a className="stat card" href={href}>
      {body}
      <Icon name="arrow" size={16} className="stat-arrow" />
    </a>
  )
}

// Single-series column chart: one hue, the latest week labelled, every column hoverable and focusable.
function WeeklyChart({ weeks }) {
  const [active, setActive] = useState(null)
  const tickStep = 100
  const top = Math.ceil(Math.max(...weeks.map((w) => w.lb)) / tickStep) * tickStep
  const ticks = Array.from({ length: top / tickStep + 1 }, (_, i) => i * tickStep)

  function percentOfTop(lb) {
    return `${(lb / top) * 100}%`
  }

  return (
    <div className="column-chart">
      <div className="column-axis" aria-hidden="true">
        {ticks.map((t) => <span key={t} style={{ bottom: percentOfTop(t) }}>{t}</span>)}
      </div>
      <div className="column-plot">
        <div className="column-grid" aria-hidden="true">
          {ticks.map((t) => <span key={t} style={{ bottom: percentOfTop(t) }} />)}
        </div>
        <ol className="columns" aria-label="Pounds of shell recycled each week">
          {weeks.map((w, i) => {
            const latest = i === weeks.length - 1
            const isActive = active === i
            return (
              <li key={w.weekOf} tabIndex={0} aria-label={`Week of ${formatDate(w.weekOf)}: ${w.lb} lb`}
                onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
                className={`${isActive ? 'active' : ''} ${(weeks.length - 1 - i) % 2 ? 'minor' : ''}`}>
                <span className="column" style={{ height: percentOfTop(w.lb) }}>
                  {latest && !isActive && <span className="column-value">{w.lb}</span>}
                  {isActive && <span className="column-tooltip" role="tooltip"><strong>{w.lb} lb</strong><span>Week of {formatDate(w.weekOf)}</span></span>}
                </span>
                <span className="column-label">{formatDate(w.weekOf, { month: 'short', day: 'numeric' })}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

// Horizontal bars in one hue, value at the tip.
function BarList({ rows }) {
  const max = Math.max(...rows.map((r) => r.value))
  return (
    <ul className="bar-list">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="bar-label">{r.label}</span>
          <span className="bar-area"><span className="bar-fill" style={{ width: `${(r.value / max) * 100}%` }} /><span className="bar-value">{r.display}</span></span>
        </li>
      ))}
    </ul>
  )
}

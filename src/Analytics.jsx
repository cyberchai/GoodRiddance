import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { carriers, dasherLbPerPickup, formatDate, lbPerShell, oysterItems, oystersPerShell, restaurant, upcomingPickups, weeklyShells } from './shellData'

const ranges = [{ weeks: 4, label: 'Last 4 weeks' }, { weeks: 12, label: 'Last 12 weeks' }]
const lbPerTrashBag = 30 // roughly one full kitchen trash bag

function formatCount(n) {
  return Math.round(n).toLocaleString()
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// Counts up (or down) from the last shown value to `target`.
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  const shown = useRef(value)

  useEffect(() => {
    if (prefersReducedMotion()) {
      shown.current = target
      setValue(target)
      return
    }
    const from = shown.current
    const start = performance.now()
    let frame
    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      shown.current = from + (target - from) * (1 - (1 - t) ** 3)
      setValue(shown.current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

export default function Analytics({ schedule }) {
  const [range, setRange] = useState(12)
  const weeks = weeklyShells.slice(-range)
  const rangeLabel = ranges.find((r) => r.weeks === range).label.toLowerCase()
  const [nextPickup] = upcomingPickups(schedule.days, 1)

  const totalLb = weeks.reduce((sum, w) => sum + w.lb, 0)
  const pickups = weeks.reduce((sum, w) => sum + w.pickups, 0)
  const dasherPickups = weeks.reduce((sum, w) => sum + w.dasher, 0)
  const shells = Math.round(totalLb / lbPerShell)
  const dasherLb = dasherPickups * dasherLbPerPickup
  const byCarrier = [
    { id: 'bop', pickups: pickups - dasherPickups, lb: totalLb - dasherLb },
    { id: 'dasher', pickups: dasherPickups, lb: dasherLb },
  ]

  return (
    <>
      <div className="analytics-toolbar">
        <span className="sample-note">Sample data</span>
        <div className="segmented" role="group" aria-label="Time range">
          {ranges.map((r) => (
            <button key={r.weeks} className={range === r.weeks ? 'selected' : ''} aria-pressed={range === r.weeks} onClick={() => setRange(r.weeks)}>{r.label}</button>
          ))}
        </div>
      </div>

      <div className="stats">
        <Stat label="Shells recycled" value={totalLb} format={(n) => `${formatCount(n)} lb`}
          note={`About ${shells.toLocaleString()} shells`} />
        <Stat label="Kept out of the landfill" value={totalLb / lbPerTrashBag} format={(n) => `${formatCount(n)} trash bags`}
          note={`About ${(totalLb / 2000).toFixed(1)} tons, at ~${lbPerTrashBag} lb per full bag`} />
        <Stat label="New homes for baby oysters" value={shells * oystersPerShell[0]} format={(n) => `${formatCount(n)}+`}
          note={`Your used shells go back into New York Harbor. Baby oysters attach to them and grow, ${oystersPerShell.join('–')} per shell.`} />
        <Stat label="Pickups completed" value={pickups} format={formatCount} href="#pickups"
          note={`${dasherPickups} by Dashers${nextPickup ? ` · next ${formatDate(nextPickup)}` : ''}`} />
      </div>

      <section className="card">
        <div className="card-heading">
          <div><h2>Shells recycled each week</h2><p className="muted">Pounds weighed at BOP’s transfer station</p></div>
        </div>
        <WeeklyChart key={range} weeks={weeks} />
        <details className="table-view">
          <summary>Show as table</summary>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Week of</th><th className="num">Shells (lb)</th><th className="num">Pickups</th><th className="num">By Dasher</th></tr></thead>
              <tbody>
                {weeks.map((w) => (
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
          <p className="muted">{restaurant.oystersPerWeek.toLocaleString()} shells a week, estimated from your menu</p>
          <BarList rows={oysterItems.map((item) => ({ label: item.name, value: item.shellsPerWeek, display: `${item.shellsPerWeek.toLocaleString()} shells` }))} />
        </section>
        <section className="card">
          <h2>Who picked them up</h2>
          <p className="muted">Pounds delivered to BOP, {rangeLabel}</p>
          <BarList key={range} rows={byCarrier.map((c) => ({ label: carriers[c.id].name, value: c.lb, display: `${c.lb.toLocaleString()} lb · ${c.pickups} pickups` }))} />
        </section>
      </div>
    </>
  )
}

function Stat({ label, value, format, note, href }) {
  const shown = useCountUp(value)
  const body = (
    <>
      <span className="stat-label">{label}</span>
      <strong className="stat-value" aria-label={format(value)}>{format(shown)}</strong>
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
// Columns grow in one after another when it mounts.
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
                <span className="column" style={{ height: percentOfTop(w.lb), '--i': i }}>
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

// Horizontal bars in one hue, value at the tip. Bars fill in when it mounts.
function BarList({ rows }) {
  const max = Math.max(...rows.map((r) => r.value))
  return (
    <ul className="bar-list">
      {rows.map((r, i) => (
        <li key={r.label}>
          <span className="bar-label">{r.label}</span>
          <span className="bar-area"><span className="bar-fill" style={{ width: `${(r.value / max) * 100}%`, '--i': i }} /><span className="bar-value">{r.display}</span></span>
        </li>
      ))}
    </ul>
  )
}

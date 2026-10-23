import { useState } from 'react'
import Icon from './Icon'
import { bop, carriers, formatDate, pickupHistory, restaurant, timeWindows, upcomingPickups, weekDays } from './shellData'

export default function Pickups({ schedule, onSave }) {
  const [draft, setDraft] = useState(schedule)
  const [error, setError] = useState('')
  const carrier = carriers[draft.carrier]
  const changed = JSON.stringify(draft) !== JSON.stringify(schedule)

  function update(changes) {
    setDraft({ ...draft, ...changes })
    setError('')
  }
  function toggleDay(day) {
    const days = draft.days.includes(day)
      ? draft.days.filter((d) => d !== day)
      : weekDays.filter((d) => d === day || draft.days.includes(d))
    update({ days })
  }
  function submit(e) {
    e.preventDefault()
    if (!draft.days.length) return setError('Choose at least one pickup day.')
    onSave(draft)
  }

  return (
    <>
      <div className="pickup-layout">
        <form className="card schedule-form" onSubmit={submit}>
          <h2>Recurring pickup</h2>

          <fieldset>
            <legend>Who picks up</legend>
            <div className="carrier-options">
              {Object.entries(carriers).map(([id, c]) => (
                <label key={id} className={`carrier-option ${draft.carrier === id ? 'selected' : ''}`}>
                  <input type="radio" name="carrier" value={id} checked={draft.carrier === id} onChange={() => update({ carrier: id })} />
                  <Icon name={c.icon} size={20} />
                  <span><strong>{c.name}</strong><small>{c.detail}</small></span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Pickup days</legend>
            <div className="day-options">
              {weekDays.map((day) => (
                <button type="button" key={day} aria-pressed={draft.days.includes(day)} className={draft.days.includes(day) ? 'chosen' : ''} onClick={() => toggleDay(day)}>{day}</button>
              ))}
            </div>
          </fieldset>

          <div className="form-row">
            <label>Time window
              <select value={draft.window} onChange={(e) => update({ window: e.target.value })}>
                {timeWindows.map((w) => <option key={w}>{w}</option>)}
              </select>
            </label>
            <label>{carrier.container}s each pickup
              <input type="number" min="1" max="8" required value={draft.containers} onChange={(e) => update({ containers: Number(e.target.value) })} />
            </label>
          </div>

          <label>Instructions for the driver
            <textarea rows="2" value={draft.instructions} onChange={(e) => update({ instructions: e.target.value })} />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <span className="muted">Pickup from {restaurant.street}, {restaurant.city}</span>
            <button className="button primary" type="submit" disabled={!changed}>{changed ? 'Save schedule' : 'Saved'}</button>
          </div>
        </form>

        <aside className="card">
          <h2>Coming up</h2>
          <ul className="upcoming">
            {upcomingPickups(schedule.days, 4).map((date) => (
              <li key={date}>
                <Icon name="calendar" size={16} />
                <span><strong>{formatDate(date)}</strong><small>{schedule.window} · {carriers[schedule.carrier].short}</small></span>
              </li>
            ))}
          </ul>
          <div className="destination">
            <span className="muted">Shells go to</span>
            <strong>{bop.dropoff}</strong>
            <small>Then to BOP’s curing site on {bop.curing}. Pickup is free.</small>
          </div>
        </aside>
      </div>

      <section className="card">
        <div className="card-heading">
          <div>
            <h2>Past pickups & donation receipts</h2>
            <p className="muted">Sample data · weights reported at the transfer station</p>
          </div>
          <button className="button secondary" onClick={downloadReceipts}><Icon name="download" size={15} /> Download receipts</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Date</th><th>Picked up by</th><th className="num">Shells (lb)</th><th>Receipt</th></tr></thead>
            <tbody>
              {pickupHistory.map((p) => (
                <tr key={p.date}>
                  <td>{formatDate(p.date)}</td>
                  <td>{carriers[p.carrier].short} · {p.driver}</td>
                  <td className="num">{p.lb}</td>
                  <td><code>{p.receipt}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine-print">
          {bop.name} is a nonprofit, so these receipts record an in-kind donation. Ask your accountant whether your shell donations are deductible.
        </p>
      </section>
    </>
  )
}

function downloadReceipts() {
  const rows = [['Receipt', 'Date', 'Recipient', 'Picked up by', 'Shell weight (lb)'],
    ...pickupHistory.map((p) => [p.receipt, p.date, bop.name, `${carriers[p.carrier].name} (${p.driver})`, p.lb])]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: 'shell-donation-receipts.csv' })
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

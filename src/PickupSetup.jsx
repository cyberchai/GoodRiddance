import { useEffect, useState } from 'react'
import Icon from './Icon'
import { haulingRatePerLb, materials, monthlySavings, partners, partnersFor, timeWindows, weekDays, weeklyLb } from './wasteData'

const steps = ['Material & partner', 'Schedule', 'Review']
const defaultAddress = '87 Atlantic Avenue, Brooklyn, NY 11201'

// 3-step setup for a new recurring pickup, or editing an existing one (pass `existing`).
export default function PickupSetup({ items, material, existing, onCancel, onSave }) {
  const [step, setStep] = useState(0)
  const [showOthers, setShowOthers] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(() => existing ?? {
    material: material ?? 'Oyster shells',
    partnerId: partnersFor(material ?? 'Oyster shells')[0]?.id,
    frequency: 'Weekly', days: ['Mon', 'Wed', 'Fri'], window: '3:00–5:00 PM', containers: 3,
    address: defaultAddress, instructions: '',
  })
  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const options = partnersFor(draft.material)
  const [suggested, ...others] = options
  const partner = partners[draft.partnerId]
  const lb = weeklyLb(items, draft.material)
  const containerWord = n => `${partner?.container ?? 'bin'}${n === 1 ? '' : 's'}`

  function update(changes) { setDraft({ ...draft, ...changes }); setError('') }
  function chooseMaterial(next) { update({ material: next, partnerId: partnersFor(next)[0]?.id }); setShowOthers(false) }
  function toggleDay(day) { update({ days: draft.days.includes(day) ? draft.days.filter(d => d !== day) : weekDays.filter(d => d === day || draft.days.includes(d)) }) }
  function next(e) {
    e.preventDefault()
    if (step === 0 && !draft.partnerId) return setError('Choose a partner for this material.')
    if (step === 1 && !draft.days.length) return setError('Choose at least one pickup day.')
    if (step < 2) return setStep(step + 1)
    onSave(draft)
  }

  const partnerOption = p => <label key={p.id} className={`partner-option ${draft.partnerId === p.id ? 'chosen' : ''}`}>
    <input type="radio" name="partner" checked={draft.partnerId === p.id} onChange={() => update({ partnerId: p.id })}/>
    <span className="partner-logo">{p.initials}</span>
    <span><strong>{p.name}</strong><small>{p.type}</small><span className="partner-blurb">{p.blurb}</span></span>
  </label>

  return <div className="modal-overlay" onClick={onCancel}>
    <section className="modal setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title" onClick={e => e.stopPropagation()}>
      <button className="modal-close icon-button" aria-label="Close" onClick={onCancel}><Icon name="close"/></button>
      <div className="gr-eyebrow"><Icon name="leaf" size={14}/> GOODRIDDANCE · {existing ? 'EDIT PICKUP' : 'NEW PICKUP'}</div>
      <h2 id="setup-title">{steps[step]}</h2>
      <ol className="setup-steps">{steps.map((s, i) => <li key={s} className={i === step ? 'current' : i < step ? 'done' : ''}><span>{i < step ? <Icon name="check" size={12}/> : i + 1}</span>{s}</li>)}</ol>

      <form onSubmit={next}>
        {step === 0 && <>
          <label>Material
            <select value={draft.material} onChange={e => chooseMaterial(e.target.value)} disabled={Boolean(existing)}>
              {Object.keys(materials).map(m => <option key={m}>{m}</option>)}
            </select>
          </label>
          <fieldset>
            <legend>Suggested partner</legend>
            {suggested && partnerOption(suggested)}
            {others.length > 0 && (showOthers
              ? others.map(partnerOption)
              : <button type="button" className="link-button" onClick={() => setShowOthers(true)}>See other partners ({others.length})</button>)}
          </fieldset>
        </>}

        {step === 1 && <>
          <label>Frequency
            <select value={draft.frequency} onChange={e => update({ frequency: e.target.value })}><option>Weekly</option><option>Every other week</option></select>
          </label>
          <fieldset>
            <legend>Pickup days <span>Select one or more</span></legend>
            <div className="day-options">{weekDays.map(day => <button type="button" key={day} aria-pressed={draft.days.includes(day)} className={draft.days.includes(day) ? 'chosen' : ''} onClick={() => toggleDay(day)}>{day}{draft.days.includes(day) && <Icon name="check" size={12}/>}</button>)}</div>
          </fieldset>
          <div className="form-row">
            <label>Time window
              <select value={draft.window} onChange={e => update({ window: e.target.value })}>{timeWindows.map(w => <option key={w}>{w}</option>)}</select>
            </label>
            <fieldset>
              <legend>Collection {containerWord(2)}</legend>
              <div className="stepper">
                <button type="button" aria-label="Fewer" disabled={draft.containers <= 1} onClick={() => update({ containers: draft.containers - 1 })}>−</button>
                <output aria-live="polite">{draft.containers}</output>
                <button type="button" aria-label="More" disabled={draft.containers >= 6} onClick={() => update({ containers: draft.containers + 1 })}>+</button>
              </div>
            </fieldset>
          </div>
          <label>Collection address<input required value={draft.address} onChange={e => update({ address: e.target.value })}/></label>
          <label>Pickup instructions <span className="optional">Optional</span>
            <textarea rows="2" placeholder="E.g. Bins are by the back entrance. Ring the kitchen bell." value={draft.instructions} onChange={e => update({ instructions: e.target.value })}/>
          </label>
        </>}

        {step === 2 && <>
          <dl className="waste-facts review">
            <div><dt>Material</dt><dd>{draft.material}</dd></div>
            <div><dt>Partner</dt><dd>{partner.name}</dd></div>
            <div><dt>Schedule</dt><dd>{draft.frequency} · {draft.days.join(', ')} · {draft.window}</dd></div>
            <div><dt>Containers</dt><dd>{draft.containers} collection {containerWord(draft.containers)}</dd></div>
            <div><dt>Address</dt><dd>{draft.address}</dd></div>
          </dl>
          {lb > 0
            ? <div className="estimate-box">
                <div><small>Material per week</small><strong>About {Math.round(lb)} lb</strong></div>
                <div><small>Hauling savings per month</small><strong>About ${Math.round(monthlySavings(lb))}</strong></div>
                <p><span className="estimate-tag">Estimated</span> From sample order counts on your menu and a sample hauling rate of ${haulingRatePerLb.toFixed(2)}/lb.</p>
              </div>
            : <p className="setup-note">Your menu doesn’t give an estimate for this material yet. Weights will show after the first pickups.</p>}
          <p className="setup-note"><Icon name="truck" size={16}/> Pickups are requested through Request a delivery (DoorDash Drive), the same network as your orders.</p>
        </>}

        {error && <div className="form-notice" role="alert">{error}</div>}
        <div className="setup-actions">
          {step > 0 ? <button type="button" className="secondary-button" onClick={() => setStep(step - 1)}>Back</button> : <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>}
          <button type="submit" className="gr-button">{step < 2 ? 'Next' : existing ? 'Save changes' : 'Start pickups'} <Icon name={step < 2 ? 'arrow' : 'check'} size={16}/></button>
        </div>
      </form>
    </section>
  </div>
}

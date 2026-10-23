import { useEffect } from 'react'
import Icon from './Icon'
import { formatDate, partnersFor, materials } from './wasteData'

// Slide-in panel that shows what one dish leaves behind and where it can go.
export default function WastePanel({ item, pickup, onClose, onSetUp, onViewPickup }) {
  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const waste = item.waste
  const partner = waste && partnersFor(waste.material)[0]
  const perWeek = waste && Math.round(waste.lbPerOrder * waste.ordersPerWeek)

  return <div className="drawer-overlay" onClick={onClose}>
    <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onClick={e => e.stopPropagation()}>
      <header className="drawer-header">
        <div>
          <div className="gr-eyebrow"><Icon name="leaf" size={14}/> GOODRIDDANCE · WASTE DETAILS</div>
          <h2 id="drawer-title">{item.name}</h2>
          <p>{item.category} · ${Number(item.price).toFixed(2)}</p>
        </div>
        <button className="icon-button" aria-label="Close waste details" onClick={onClose} autoFocus><Icon name="close"/></button>
      </header>

      {waste ? <>
        <dl className="waste-facts">
          <div><dt>Byproduct</dt><dd>{waste.material}</dd></div>
          <div><dt>Amount</dt><dd>About {waste.lbPerOrder} lb per order, about {perWeek} lb per week <span className="estimate-tag">Estimated</span><small>Based on about {waste.ordersPerWeek} orders a week (sample)</small></dd></div>
          <div><dt>Best route</dt><dd>{materials[waste.material].route} → {partner?.name ?? 'No partner yet'}</dd></div>
          <div><dt>Why</dt><dd>{waste.why}</dd></div>
          <div><dt>Donation</dt><dd><span className="neutral-chip">{waste.donation?.note ?? 'Check food-safety rules before donating'}</span></dd></div>
          <div><dt>Pickup</dt><dd>{pickup
            ? <span className={`status-chip ${pickup.status}`}>{pickup.status === 'paused' ? 'Paused' : `${pickup.days.join(', ')} · next ${formatDate(pickup.nextPickup)}`}</span>
            : 'No pickup yet'}</dd></div>
        </dl>
        <div className="drawer-actions">
          {pickup
            ? <button className="gr-button" onClick={onViewPickup}>View pickup <Icon name="arrow" size={16}/></button>
            : <button className="gr-button" onClick={onSetUp}>Set up pickup <Icon name="arrow" size={16}/></button>}
          <button className="secondary-button" onClick={onClose}>Not now</button>
        </div>
      </> : <div className="drawer-empty">
        <Icon name="leaf" size={26}/>
        <h3>Nothing flagged for this dish.</h3>
        <p>The scan didn’t find a byproduct worth a separate pickup. If that’s wrong, edit the dish and choose what it leaves behind.</p>
      </div>}
    </aside>
  </div>
}

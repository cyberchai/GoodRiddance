import { useEffect, useState } from 'react'
import Icon from './CxIcon'
import { CategoryArt, FoodArt } from './Art'
import { categoryRows, customer, dropOffs, impactHistory, menu, partner, shellReturnFee, stores } from './customerData'
import './customer.css'

const storeById = id => stores.find(s => s.id === id)
const itemById = id => menu.find(m => m.id === id)
const money = n => `$${n.toFixed(2)}`
const lbText = n => `${Math.round(n * 10) / 10}`.replace(/\.0$/, '')
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const shortDate = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return todayIsoOf(d) }
const todayIsoOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const TIP_RATES = [0.15, 0.18, 0.2, 0.25]
const TAX_RATE = 0.08875

// Totals for a cart: [{ id, qty }]
function priceCart(cart, { shellReturn, tipRate }) {
  const lines = cart.map(l => ({ ...l, item: itemById(l.id) }))
  const subtotal = lines.reduce((s, l) => s + l.item.price * l.qty, 0)
  const store = lines[0] && storeById(lines[0].item.storeId)
  const delivery = store ? store.fee : 0
  const service = Math.round(subtotal * 0.1 * 100) / 100
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100
  const shell = shellReturn ? shellReturnFee : 0
  const tip = Math.round(subtotal * tipRate * 100) / 100
  const shellLb = lines.reduce((s, l) => s + (l.item.shellReturn ? (l.item.shellLb || 0) * l.qty : 0), 0)
  return { lines, store, subtotal, delivery, service, tax, shell, tip, shellLb, total: subtotal + delivery + service + tax + shell + tip }
}

function Badge({ children = 'Shell recycling', onClick }) {
  const Tag = onClick ? 'button' : 'span'
  return <Tag className="gr-badge" onClick={onClick}><Icon name="shell" size={13} strokeWidth={2}/>{children}{onClick && <Icon name="info" size={13} strokeWidth={2}/>}</Tag>
}

function Stars({ store }) {
  return <span className="cx-rating"><Icon name="star" size={12} fill="currentColor" strokeWidth={0}/>{store.rating} <span className="cx-muted">({store.reviews >= 1000 ? `${(store.reviews / 1000).toFixed(1)}k` : store.reviews}+)</span></span>
}

const feeText = s => s.fee === 0 ? '$0 delivery fee' : `${money(s.fee)} delivery fee`

function Sheet({ label, onClose, size = '', children }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return <div className="cx-overlay" onClick={onClose}>
    <section className={`cx-sheet ${size}`} role="dialog" aria-modal="true" aria-label={label} onClick={e => e.stopPropagation()}>
      <div className="cx-grabber"/>
      <button className="cx-sheet-close" aria-label="Close" onClick={onClose}><Icon name="close" size={20}/></button>
      {children}
    </section>
  </div>
}

/* ---------------- Home ---------------- */

function StoreCard({ store, onOpen, wide }) {
  return <button className={`cx-store-card ${wide ? 'wide' : ''}`} onClick={() => onOpen(store.id)}>
    <div className="cx-store-img"><FoodArt kind={store.art}/>{store.dashPass && <span className="cx-dp-tag"><Icon name="ticket" size={11} strokeWidth={2.2}/>DashPass</span>}</div>
    <div className="cx-store-meta">
      <strong>{store.name}</strong>
      <span><Stars store={store}/> · {store.distanceMi} mi · {store.etaMin} min</span>
      <span className="cx-muted">{feeText(store)}</span>
      {store.badge && <Badge/>}
    </div>
  </button>
}

function Home({ circular, setCircular, onStore, onToast, cartCount, onCart, onBell, hasNotice }) {
  const list = circular ? stores.filter(s => s.badge) : stores
  const recycled = stores.filter(s => s.badge)
  const recent = ['s4', 's1', 's2'].map(storeById).filter(s => !circular || s.badge)
  return <>
    <header className="cx-topbar">
      <button className="cx-address" onClick={() => onToast('Address changes are not part of this prototype')}><Icon name="pin" size={18} fill="currentColor" stroke="#fff" strokeWidth={1.5}/>{customer.address}<Icon name="down" size={16} strokeWidth={2.4}/></button>
      <div className="cx-top-actions">
        <button className="cx-icon-btn" aria-label="Notifications" onClick={onBell}><Icon name="bell"/>{hasNotice && <span className="cx-dot"/>}</button>
        <button className="cx-icon-btn" aria-label="Cart" onClick={onCart}><Icon name="cart"/>{cartCount > 0 && <span className="cx-count">{cartCount}</span>}</button>
      </div>
    </header>
    <div className="cx-search-row">
      <label className="cx-search"><Icon name="search" size={20} strokeWidth={2.2}/><input placeholder="Search DoorDash" aria-label="Search" onFocus={e => { e.target.blur(); onToast('Try the Browse tab to search stores') }}/></label>
      <button className="cx-round-btn" aria-label="Map" onClick={() => onToast('Map view is not part of this prototype')}><Icon name="map" size={20}/></button>
    </div>
    {categoryRows.map((row, i) => <div className={`cx-cats ${i === 0 ? 'first' : ''}`} key={i}>
      {row.map(c => <button key={c} className="cx-cat" onClick={() => { if (c === 'Seafood') onStore('s1'); else onToast(`${c} is not part of this prototype`) }}>
        <CategoryArt name={c}/><span>{c}</span>
      </button>)}
    </div>)}
    <div className="cx-chips">
      <button className="cx-chip" onClick={() => onToast('DashPass filter is not part of this prototype')}><Icon name="ticket" size={16}/>DashPass</button>
      <button className={`cx-chip gr-chip ${circular ? 'on' : ''}`} aria-pressed={circular} onClick={() => setCircular(!circular)}><Icon name="leaf" size={16}/>Recycles waste</button>
      <button className="cx-chip" onClick={() => onToast('Pickup is not part of this prototype')}><Icon name="walk" size={16}/>Pickup</button>
      <button className="cx-chip" onClick={() => onToast('Ratings filter is not part of this prototype')}><Icon name="star" size={15} fill="currentColor" strokeWidth={0}/>Ratings<Icon name="down" size={14} strokeWidth={2.4}/></button>
    </div>

    {circular && <div className="gr-filter-note"><Icon name="leaf" size={16}/><span><strong>{list.length} stores near you recycle their waste.</strong> They send kitchen scraps and shells to recycling or donation through Good Riddance.</span></div>}

    {!circular && <section className="gr-banner">
      <div className="gr-banner-copy">
        <h2>Oyster season, shells included</h2>
        <p>Order from restaurants that recycle their shells into reef-building material.</p>
        <button onClick={() => setCircular(true)}>See restaurants</button>
      </div>
      <div className="gr-banner-art" aria-hidden="true"><FoodArt kind="oysters"/></div>
    </section>}

    <section className="cx-section">
      <div className="cx-section-head"><h2>NYC shell recyclers</h2><button className="cx-round-btn sm" aria-label="See all shell recyclers" onClick={() => setCircular(true)}><Icon name="arrow" size={18} strokeWidth={2.2}/></button></div>
      <div className="cx-carousel">{recycled.map(s => <StoreCard key={s.id} store={s} onOpen={onStore}/>)}</div>
    </section>

    {recent.length > 0 && <section className="cx-section">
      <div className="cx-section-head"><h2>Recently viewed</h2><button className="cx-round-btn sm" aria-label="See all recently viewed" onClick={() => onToast('Not part of this prototype')}><Icon name="arrow" size={18} strokeWidth={2.2}/></button></div>
      <div className="cx-carousel">{recent.map(s => <StoreCard key={s.id} store={s} onOpen={onStore} wide/>)}</div>
    </section>}

    <section className="cx-section">
      <div className="cx-section-head"><h2>{circular ? 'Stores that recycle waste' : 'All stores'}</h2></div>
      <div className="cx-store-list">{list.map(s => <StoreCard key={s.id} store={s} onOpen={onStore} wide/>)}</div>
    </section>
  </>
}

/* ---------------- Browse (search with badges) ---------------- */

function Browse({ onStore }) {
  const [q, setQ] = useState('')
  const hits = stores.filter(s => `${s.name} ${s.cuisine}`.toLowerCase().includes(q.toLowerCase()))
  return <>
    <header className="cx-page-head"><h1>Browse</h1></header>
    <div className="cx-search-row"><label className="cx-search"><Icon name="search" size={20} strokeWidth={2.2}/><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search stores or dishes" aria-label="Search stores"/></label></div>
    <div className="cx-results">
      {hits.map(s => <button key={s.id} className="cx-result" onClick={() => onStore(s.id)}>
        <div className="cx-result-img"><FoodArt kind={s.art}/></div>
        <div><strong>{s.name}</strong><span className="cx-muted">{s.cuisine} · {s.distanceMi} mi · {s.etaMin} min</span><span><Stars store={s}/></span>{s.badge && <Badge>Shell recycling partner</Badge>}</div>
      </button>)}
      {hits.length === 0 && <p className="cx-empty">No stores match “{q}”.</p>}
    </div>
  </>
}

/* ---------------- Store ---------------- */

function BadgeSheet({ store, onClose }) {
  return <Sheet label="Shell recycling partner" onClose={onClose} size="mid">
    <div className="gr-sheet-icon"><Icon name="shell" size={28}/></div>
    <h2 className="cx-sheet-title">Shell recycling partner</h2>
    <p className="cx-sheet-lead">{store.name} sends its oyster and clam shells to {partner.name}.</p>
    <div className="gr-stats">
      <div><strong>{store.stats90d.lbRecycled.toLocaleString()} lb</strong><span>of shells recycled in the last 90 days</span></div>
      <div><strong>{store.stats90d.pickups}</strong><span>pickups completed</span></div>
    </div>
    <p className="cx-sheet-body">{partner.name} cures restaurant shells for a year, then uses them to build oyster reefs in New York Harbor.</p>
    <div className="gr-verified"><Icon name="check" size={16} strokeWidth={2.4}/>Verified by Good Riddance pickup records.</div>
    <div className="cx-sheet-actions">
      <a className="cx-link" href={partner.url} target="_blank" rel="noreferrer">Learn more</a>
      <button className="cx-btn dark" onClick={onClose}>Close</button>
    </div>
  </Sheet>
}

function ItemSheet({ item, onClose, onAdd }) {
  const [qty, setQty] = useState(1)
  return <Sheet label={item.name} onClose={onClose} size="tall">
    <div className="cx-item-hero"><FoodArt kind={item.art}/></div>
    <div className="cx-item-body">
      <h2 className="cx-sheet-title">{item.name}</h2>
      <div className="cx-item-price">{money(item.price)}</div>
      <p className="cx-muted">{item.desc}</p>
      {item.shellReturn && <div className="gr-info-row"><Icon name="shell" size={20}/><p>Shells from this dish are recycled. Add “Return your shells” at checkout to recycle the shells from your delivery too.</p></div>}
      {item.circular && <div className="gr-label-block"><span className="gr-food-label"><Icon name="leaf" size={14}/>{item.circular.label}</span><p>{item.circular.note}</p></div>}
    </div>
    <div className="cx-item-footer">
      <div className="cx-stepper">
        <button aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(qty - 1)}><Icon name="minus" size={18} strokeWidth={2.4}/></button>
        <span aria-live="polite">{qty}</span>
        <button aria-label="Increase quantity" onClick={() => setQty(qty + 1)}><Icon name="plus" size={18} strokeWidth={2.4}/></button>
      </div>
      <button className="cx-btn red grow" onClick={() => onAdd(item.id, qty)}>Add to cart · {money(item.price * qty)}</button>
    </div>
  </Sheet>
}

function Store({ store, onBack, onItem, onBadge, cart, onCheckout }) {
  const items = menu.filter(m => m.storeId === store.id)
  const sections = [...new Set(items.map(m => m.section))]
  const inCart = cart.length && itemById(cart[0].id).storeId === store.id
  const count = cart.reduce((s, l) => s + l.qty, 0)
  const subtotal = cart.reduce((s, l) => s + itemById(l.id).price * l.qty, 0)
  return <>
    <div className="cx-cover"><FoodArt kind={store.art}/><button className="cx-float-btn" aria-label="Back" onClick={onBack}><Icon name="back" size={20} strokeWidth={2.2}/></button></div>
    <div className="cx-store-head">
      <div className="cx-store-logo"><FoodArt kind={store.art}/></div>
      <h1>{store.name}</h1>
      <div className="cx-store-sub"><Stars store={store}/> · {store.cuisine} · {store.distanceMi} mi</div>
      {store.badge && <Badge onClick={onBadge}>Shell recycling partner</Badge>}
      <div className="cx-store-facts">
        <div><strong>{money(store.fee)}</strong><span>delivery fee</span></div>
        <div><strong>{store.etaMin} min</strong><span>delivery time</span></div>
        {store.dashPass && <div className="cx-dp"><Icon name="ticket" size={16}/><span>DashPass</span></div>}
      </div>
    </div>
    <nav className="cx-tabs" aria-label="Menu sections">{sections.map(s => <a key={s} href={`#sec-${s}`} onClick={e => { e.preventDefault(); document.getElementById(`sec-${s}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{s}</a>)}</nav>
    {sections.map(sec => <section key={sec} id={`sec-${sec}`} className="cx-menu-sec">
      <h2>{sec}</h2>
      {items.filter(m => m.section === sec).map(m => <button key={m.id} className="cx-menu-row" onClick={() => onItem(m.id)}>
        <div className="cx-menu-text">
          <strong>{m.name}</strong>
          <span className="cx-muted cx-clamp">{m.desc}</span>
          <span className="cx-menu-price">{money(m.price)}{(m.shellReturn || m.circular) && <span className="gr-flag" title={m.shellReturn ? 'Shells recycled' : 'Made with rescued ingredients'}><Icon name={m.shellReturn ? 'shell' : 'leaf'} size={14} strokeWidth={2}/></span>}{m.popular && <span className="cx-popular">Popular</span>}</span>
        </div>
        <div className="cx-menu-img"><FoodArt kind={m.art}/><span className="cx-add"><Icon name="plus" size={16} strokeWidth={2.6}/></span></div>
      </button>)}
    </section>)}
    <div className="cx-bottom-pad"/>
    {inCart ? <div className="cx-sticky-bar"><button className="cx-btn red grow" onClick={onCheckout}><span className="cx-qty-pill">{count}</span>View cart<span>{money(subtotal)}</span></button></div> : null}
  </>
}

/* ---------------- Checkout ---------------- */

function Toggle({ on, onChange, label, teal }) {
  return <button role="switch" aria-checked={on} aria-label={label} className={`cx-toggle ${on ? 'on' : ''} ${teal ? 'teal' : ''}`} onClick={() => onChange(!on)}><span/></button>
}

function Checkout({ cart, setCart, onBack, onPlace }) {
  const [shellReturn, setShellReturn] = useState(false)
  const [utensils, setUtensils] = useState(false)
  const [tipRate, setTipRate] = useState(0.18)
  if (!cart.length) return <>
    <header className="cx-sub-head"><button className="cx-icon-btn" aria-label="Back" onClick={onBack}><Icon name="back"/></button><h1>Cart</h1></header>
    <div className="cx-empty-state"><Icon name="cart" size={40}/><h2>Your cart is empty</h2><p className="cx-muted">Add items from a store to start an order.</p></div>
  </>
  const p = priceCart(cart, { shellReturn, tipRate })
  const hasShellfish = p.lines.some(l => l.item.shellReturn)
  const changeQty = (id, d) => setCart(cart.map(l => l.id === id ? { ...l, qty: l.qty + d } : l).filter(l => l.qty > 0))
  return <>
    <header className="cx-sub-head"><button className="cx-icon-btn" aria-label="Back" onClick={onBack}><Icon name="back"/></button><h1>Checkout</h1></header>
    <div className="cx-co-store">{p.store.name}</div>
    <section className="cx-card-list">
      <div className="cx-row"><Icon name="pin" size={20}/><div><strong>{customer.address}</strong><span className="cx-muted">Leave at door</span></div><Icon name="chev" size={18}/></div>
      <div className="cx-row"><Icon name="clock" size={20}/><div><strong>Standard</strong><span className="cx-muted">{p.store.etaMin}–{p.store.etaMin + 10} min</span></div><span className="cx-check-dot"><Icon name="check" size={14} strokeWidth={3}/></span></div>
    </section>

    <section className="cx-co-sec">
      <h2>Order summary</h2>
      {p.lines.map(l => <div className="cx-line" key={l.id}>
        <div className="cx-line-img"><FoodArt kind={l.item.art}/></div>
        <div className="cx-line-text"><strong>{l.item.name}</strong><span className="cx-muted">{money(l.item.price * l.qty)}</span></div>
        <div className="cx-stepper sm">
          <button aria-label={`Remove one ${l.item.name}`} onClick={() => changeQty(l.id, -1)}><Icon name="minus" size={14} strokeWidth={2.6}/></button>
          <span>{l.qty}</span>
          <button aria-label={`Add one ${l.item.name}`} onClick={() => changeQty(l.id, 1)}><Icon name="plus" size={14} strokeWidth={2.6}/></button>
        </div>
      </div>)}
    </section>

    <section className="cx-co-sec">
      <h2>Order options</h2>
      <div className="cx-opt"><div><strong>Utensils, napkins and straws</strong><span className="cx-muted">Only ask for them if you need them.</span></div><Toggle on={utensils} onChange={setUtensils} label="Utensils, napkins and straws"/></div>
      {hasShellfish && <div className={`cx-opt gr-opt ${shellReturn ? 'on' : ''}`}>
        <div>
          <strong className="gr-opt-title"><Icon name="shell" size={16} strokeWidth={2}/>Return your shells (+{money(shellReturnFee)})</strong>
          <span className="cx-muted">Your order comes with a reusable shell bag. Return it with your next order or drop it at a partner restaurant. Shells go to {partner.name}.</span>
        </div>
        <Toggle on={shellReturn} onChange={setShellReturn} label="Return your shells" teal/>
      </div>}
    </section>

    <section className="cx-co-sec">
      <h2>Dasher tip</h2>
      <p className="cx-muted cx-tip-note">100% of the tip goes to your Dasher.</p>
      <div className="cx-tips">{TIP_RATES.map(r => <button key={r} className={tipRate === r ? 'on' : ''} onClick={() => setTipRate(r)}>{money(Math.round(p.subtotal * r * 100) / 100)}<small>{Math.round(r * 100)}%</small></button>)}</div>
    </section>

    <section className="cx-co-sec cx-fees">
      <div><span>Subtotal</span><span>{money(p.subtotal)}</span></div>
      <div><span>Delivery fee</span><span>{money(p.delivery)}</span></div>
      <div><span>Service fee</span><span>{money(p.service)}</span></div>
      <div><span>Estimated tax</span><span>{money(p.tax)}</span></div>
      {shellReturn && <div className="gr-fee"><span><Icon name="shell" size={14} strokeWidth={2}/>Shell return</span><span>{money(p.shell)}</span></div>}
      <div><span>Dasher tip</span><span>{money(p.tip)}</span></div>
      <div className="cx-total"><span>Total</span><span>{money(p.total)}</span></div>
    </section>
    <div className="cx-row cx-pay"><Icon name="card" size={20}/><div><strong>Visa ···· 0000</strong><span className="cx-muted">Sample card, no payment is made</span></div></div>
    <div className="cx-bottom-pad"/>
    <div className="cx-sticky-bar"><button className="cx-btn red grow" onClick={() => onPlace({ shellReturn, tipRate })}>Place order<span>{money(p.total)}</span></button></div>
  </>
}

/* ---------------- Delivered + receipt ---------------- */

function Delivered({ order, onDone, onHow }) {
  const [ack, setAck] = useState(false)
  const p = order.price
  return <>
    <header className="cx-sub-head"><button className="cx-icon-btn" aria-label="Close" onClick={onDone}><Icon name="close"/></button><h1>Order</h1></header>
    <div className="cx-delivered">
      <div className="cx-delivered-icon"><Icon name="door" size={34}/></div>
      <h2>Your order was delivered</h2>
      <p className="cx-muted">Left at your door at {order.deliveredAt} · {p.store.name}</p>
    </div>
    {order.shellReturn && !ack && <section className="gr-card">
      <div className="gr-card-head"><Icon name="shell" size={22}/><h3>Shell bag included</h3></div>
      <p>Return it within 7 days. We’ll remind you tomorrow.</p>
      <div className="gr-card-actions"><button className="gr-btn ghost" onClick={onHow}>How it works</button><button className="gr-btn" onClick={() => setAck(true)}>Got it</button></div>
    </section>}
    <section className="cx-co-sec cx-receipt">
      <h2><Icon name="receipt" size={20}/> Receipt</h2>
      {p.lines.map(l => <div className="cx-receipt-line" key={l.id}><span>{l.qty}× {l.item.name}</span><span>{money(l.item.price * l.qty)}</span></div>)}
      <div className="cx-fees">
        <div><span>Subtotal</span><span>{money(p.subtotal)}</span></div>
        <div><span>Delivery fee</span><span>{money(p.delivery)}</span></div>
        <div><span>Service fee</span><span>{money(p.service)}</span></div>
        <div><span>Estimated tax</span><span>{money(p.tax)}</span></div>
        {order.shellReturn && <div className="gr-fee"><span>Shell return</span><span>{money(p.shell)}</span></div>}
        <div><span>Dasher tip</span><span>{money(p.tip)}</span></div>
        <div className="cx-total"><span>Total</span><span>{money(p.total)}</span></div>
      </div>
      {order.shellReturn
        ? <div className="gr-impact-line"><Icon name="leaf" size={16}/>This order: about {lbText(p.shellLb)} lb of shells set aside for recycling (estimated).</div>
        : p.store.badge && <div className="gr-impact-line"><Icon name="leaf" size={16}/>{p.store.name} recycles the shells from its dine-in and kitchen orders.</div>}
    </section>
    <div className="cx-bottom-pad"/>
    <div className="cx-sticky-bar"><button className="cx-btn dark grow" onClick={onDone}>Done</button></div>
  </>
}

function HowSheet({ onClose }) {
  const steps = [
    ['bag', 'Keep the bag', 'Put your oyster and clam shells back in the shell bag that came with your order.'],
    ['truck', 'Return it', 'Leave it for your next Dasher, or drop it at a partner restaurant within 7 days.'],
    ['recycle', 'Shells get recycled', `${partner.name} cures the shells for a year, then uses them to build oyster reefs.`],
  ]
  return <Sheet label="How shell return works" onClose={onClose} size="mid">
    <h2 className="cx-sheet-title">How shell return works</h2>
    <ol className="gr-steps">{steps.map(([icon, t, d], i) => <li key={t}><span className="gr-step-num"><Icon name={icon} size={18}/></span><div><strong>{i + 1}. {t}</strong><p className="cx-muted">{d}</p></div></li>)}</ol>
    <div className="cx-sheet-actions"><span/><button className="cx-btn dark" onClick={onClose}>Got it</button></div>
  </Sheet>
}

/* ---------------- Return flow ---------------- */

function ReturnScreen({ entry, onBack, onChoose, onDropoff, onSimulate }) {
  if (!entry) return <>
    <header className="cx-sub-head"><button className="cx-icon-btn" aria-label="Back" onClick={onBack}><Icon name="back"/></button><h1>Return your shells</h1></header>
    <div className="cx-empty-state"><Icon name="shell" size={40}/><h2>No shell bags to return</h2><p className="cx-muted">Turn on “Return your shells” at checkout when you order oysters or clams.</p></div>
  </>
  const store = storeById(entry.storeId)
  return <>
    <header className="cx-sub-head"><button className="cx-icon-btn" aria-label="Back" onClick={onBack}><Icon name="back"/></button><h1>Return your shells</h1></header>
    <p className="cx-return-lead">1 shell bag from {store.name} · about {lbText(entry.lb)} lb (estimated) · return by {shortDate(entry.dueDate)}</p>
    {entry.status === 'pending' && <section className="gr-pending">
      <span className="gr-status">Pending</span>
      <p>{entry.method === 'driver' ? 'Your next driver will pick up your shell bag.' : 'Bring your shell bag to a partner restaurant.'}</p>
      <button className="cx-link" onClick={onSimulate}>Simulate return (prototype)</button>
    </section>}
    <section className={`gr-option ${entry.method === 'driver' ? 'chosen' : ''}`}>
      <div className="gr-option-icon"><Icon name="truck" size={26}/></div>
      <h2>Hand to my next driver</h2>
      <p className="cx-muted">Leave the bag at your door when your next order arrives. We’ll add a note for the driver.</p>
      {entry.method === 'driver' ? <div className="gr-confirm"><Icon name="check" size={16} strokeWidth={2.6}/>Added to your next order</div>
        : <button className="gr-btn" onClick={() => onChoose('driver')}>Add to next order</button>}
    </section>
    <section className={`gr-option ${entry.method === 'dropoff' ? 'chosen' : ''}`}>
      <div className="gr-option-icon"><Icon name="pin" size={26}/></div>
      <h2>Drop off nearby</h2>
      <p className="cx-muted">Bring the bag to a partner restaurant.</p>
      <button className="cx-map-preview" onClick={onDropoff} aria-label="See drop-off spots on the map"><DropMap small/></button>
      <button className="gr-btn ghost" onClick={onDropoff}>See {dropOffs.length} drop-off spots</button>
    </section>
    <div className="cx-bottom-pad"/>
  </>
}

function DropMap({ small }) {
  const pins = [[150, 92], [232, 150], [92, 182]]
  return <svg className={`cx-map ${small ? 'small' : ''}`} viewBox="0 0 340 230" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of partner drop-off spots">
    <rect width="340" height="230" fill="#eef0eb"/>
    <path d="M0 0h52q-10 60 6 120t-18 110H0Z" fill="#cfe1ea"/>
    {[40, 85, 130, 175, 220].map(y => <path key={y} d={`M40 ${y}h300`} stroke="#fff" strokeWidth="7"/>)}
    {[90, 150, 210, 270].map(x => <path key={x} d={`M${x} 0v230`} stroke="#fff" strokeWidth="7"/>)}
    <path d="M60 230 300 0" stroke="#fff" strokeWidth="10"/>
    <rect x="232" y="52" width="70" height="40" rx="4" fill="#d9e8d2"/>
    <g transform="translate(182 120)"><circle r="16" fill="#3b82f6" opacity=".18"/><circle r="7" fill="#3b82f6" stroke="#fff" strokeWidth="3"/></g>
    {pins.map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>
      <path d="M0 0c-9-12-14-18-14-25a14 14 0 0 1 28 0c0 7-5 13-14 25Z" fill="#1C6C74" stroke="#fff" strokeWidth="2"/>
      <text y="-21" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{i + 1}</text>
    </g>)}
  </svg>
}

function DropoffScreen({ entry, onBack, onChoose, onToast }) {
  return <>
    <header className="cx-sub-head"><button className="cx-icon-btn" aria-label="Back" onClick={onBack}><Icon name="back"/></button><h1>Drop off nearby</h1></header>
    <DropMap/>
    <p className="cx-return-lead">Partner restaurants that take shell bags. Hand the bag to staff at the counter.</p>
    <ul className="gr-drop-list">{dropOffs.map((d, i) => {
      const s = storeById(d.storeId)
      return <li key={d.storeId}>
        <span className="gr-pin-num">{i + 1}</span>
        <div><strong>{s.name}</strong><span className="cx-muted">{d.distanceMi} mi · {d.hours}</span></div>
        <button className="gr-btn ghost sm" onClick={() => onToast(`Directions to ${s.name} would open in Maps`)}>Directions</button>
      </li>
    })}</ul>
    {entry && entry.method !== 'dropoff' && <div className="cx-sticky-bar"><button className="gr-btn grow" onClick={() => onChoose('dropoff')}>I’ll drop it off</button></div>}
    {entry?.method === 'dropoff' && <div className="gr-confirm center"><Icon name="check" size={16} strokeWidth={2.6}/>Return marked pending: drop-off</div>}
    <div className="cx-bottom-pad"/>
  </>
}

/* ---------------- Me + impact ---------------- */

function Me({ onImpact, onReturn, awaiting, onToast, onReset }) {
  const rows = [['receipt', 'Orders'], ['card', 'Payment'], ['pin', 'Addresses'], ['gift', 'Gift cards'], ['help', 'Help']]
  return <>
    <header className="cx-page-head"><h1>Account</h1></header>
    <div className="cx-profile"><div className="cx-avatar">{customer.name[0]}</div><div><strong>{customer.name}</strong><span className="cx-muted">View profile</span></div></div>
    {awaiting && <button className="gr-me-alert" onClick={onReturn}><Icon name="shell" size={20}/><span><strong>1 shell bag to return</strong><span>{awaiting.status === 'pending' ? 'Return pending' : `Return by ${shortDate(awaiting.dueDate)}`}</span></span><Icon name="chev" size={18}/></button>}
    <div className="cx-menu-list">
      <button className="cx-me-row gr-me-row" onClick={onImpact}><span className="gr-me-icon"><Icon name="leaf" size={18}/></span><span>My impact</span><Icon name="chev" size={18}/></button>
      {rows.map(([icon, label]) => <button key={label} className="cx-me-row" onClick={() => onToast(`${label} is not part of this prototype`)}><Icon name={icon} size={20}/><span>{label}</span><Icon name="chev" size={18}/></button>)}
    </div>
    <button className="cx-reset" onClick={onReset}>Reset demo data</button>
  </>
}

function Impact({ history, onBack }) {
  const returned = history.filter(h => h.status === 'returned')
  const lb = returned.reduce((s, h) => s + (h.lb || 0), 0)
  const milestones = [['First return', 1], ['3 returns', 3], ['5 returns', 5], ['10 returns', 10]]
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date))
  return <>
    <header className="cx-sub-head"><button className="cx-icon-btn" aria-label="Back" onClick={onBack}><Icon name="back"/></button><h1>My impact</h1></header>
    <div className="gr-tiles">
      <div><strong>{returned.length}</strong><span>shell bags returned</span></div>
      <div><strong>~{Math.round(lb)} lb</strong><span>shells recycled from your orders <em>(estimated)</em></span></div>
      <div><strong>{history.length}</strong><span>orders from stores that recycle</span></div>
    </div>
    <p className="gr-tile-note">Weights are estimates per dish unless the bag was weighed at pickup.</p>
    <section className="cx-co-sec">
      <h2>Milestones</h2>
      <div className="gr-milestones">{milestones.map(([label, n]) => <span key={label} className={`gr-milestone ${returned.length >= n ? 'got' : ''}`}>{returned.length >= n && <Icon name="check" size={14} strokeWidth={2.6}/>}{label}</span>)}</div>
    </section>
    <section className="cx-co-sec">
      <h2>History</h2>
      <ul className="gr-history">{sorted.map((h, i) => <li key={`${h.date}-${i}`}>
        <span className={`gr-hist-icon ${h.status}`}><Icon name={h.status === 'ordered' ? 'leaf' : 'shell'} size={16}/></span>
        <div><strong>{eventText(h)}</strong><span className="cx-muted">{shortDate(h.date)} · {storeById(h.storeId).name}{h.lb ? ` · about ${lbText(h.lb)} lb (est.)` : ''}</span></div>
      </li>)}</ul>
    </section>
    <div className="cx-bottom-pad"/>
  </>
}

function eventText(h) {
  if (h.status === 'returned') return 'Shell bag returned'
  if (h.status === 'pending') return h.method === 'driver' ? 'Return pending · next driver' : 'Return pending · drop-off'
  if (h.status === 'awaiting') return 'Shell bag delivered, not yet returned'
  return 'Ordered from a shell recycling partner'
}

/* ---------------- App ---------------- */

const seedHistory = () => impactHistory.map((h, i) => ({ ...h, id: `seed-${i}`, status: h.event === 'Shell bag returned' ? 'returned' : 'ordered' }))
const TABS = [['home', 'Home', 'home'], ['grocery', 'Grocery', 'bag'], ['retail', 'Retail', 'retail'], ['browse', 'Browse', 'browse'], ['me', 'Me', 'user']]

export default function CustomerApp() {
  const [stack, setStack] = useState([{ name: 'home' }])
  const [circular, setCircular] = useState(false)
  const [cart, setCart] = useState([])
  const [order, setOrder] = useState(null)
  const [history, setHistory] = useState(seedHistory)
  const [sheet, setSheet] = useState(null) // { type: 'badge'|'item'|'how', id }
  const [notice, setNotice] = useState(false)
  const [nextDayReady, setNextDayReady] = useState(false)
  const [toast, setToast] = useState('')
  const screen = stack[stack.length - 1]

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t) }, [toast])
  useEffect(() => { document.title = 'Good Riddance · Customer prototype' }, [])

  const go = next => setStack(s => [...s, next])
  const back = () => setStack(s => s.length > 1 ? s.slice(0, -1) : s)
  const tab = name => {
    if (name === 'grocery' || name === 'retail') { setToast(`${name === 'grocery' ? 'Grocery' : 'Retail'} is not part of this prototype`); return }
    setStack([{ name }])
  }
  const rootTab = stack[0].name
  const awaiting = [...history].reverse().find(h => h.status === 'awaiting' || h.status === 'pending')
  const cartCount = cart.reduce((s, l) => s + l.qty, 0)

  function addToCart(id, qty) {
    const item = itemById(id)
    const sameStore = cart.length === 0 || itemById(cart[0].id).storeId === item.storeId
    const base = sameStore ? cart : []
    const existing = base.find(l => l.id === id)
    setCart(existing ? base.map(l => l.id === id ? { ...l, qty: l.qty + qty } : l) : [...base, { id, qty }])
    setSheet(null)
    setToast(sameStore ? `Added ${qty} × ${item.name}` : `Started a new cart from ${storeById(item.storeId).name}`)
  }

  function placeOrder({ shellReturn, tipRate }) {
    const price = priceCart(cart, { shellReturn, tipRate })
    const now = new Date(Date.now() + price.store.etaMin * 60000)
    const deliveredAt = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const date = todayIso()
    const placed = { id: `o-${Date.now()}`, price, shellReturn, deliveredAt, date }
    setOrder(placed)
    if (price.store.badge) {
      setHistory(h => [...h, shellReturn
        ? { id: placed.id, date, storeId: price.store.id, status: 'awaiting', lb: price.shellLb, dueDate: addDays(date, 7) }
        : { id: placed.id, date, storeId: price.store.id, status: 'ordered' }])
    }
    setCart([])
    setStack([{ name: 'home' }, { name: 'delivered' }])
    if (shellReturn) setNextDayReady(true)
  }

  function chooseReturn(method) {
    if (!awaiting) return
    setHistory(h => h.map(e => e.id === awaiting.id ? { ...e, status: 'pending', method } : e))
    setToast(method === 'driver' ? 'Your next driver will pick up your shell bag.' : 'Return marked pending: drop-off')
  }

  function simulateReturn() {
    if (!awaiting) return
    setHistory(h => h.map(e => e.id === awaiting.id ? { ...e, status: 'returned', date: todayIso() } : e))
    setNotice(false)
    setToast('Shell bag returned. Your shells are set aside for recycling.')
    setStack([{ name: 'me' }, { name: 'impact' }])
  }

  function reset() {
    setHistory(seedHistory()); setCart([]); setOrder(null); setNotice(false); setNextDayReady(false); setCircular(false)
    setStack([{ name: 'home' }]); setToast('Demo data reset')
  }

  const showNav = ['home', 'browse', 'me', 'impact'].includes(screen.name)
  let body
  switch (screen.name) {
    case 'store': body = <Store store={storeById(screen.id)} cart={cart} onBack={back} onItem={id => setSheet({ type: 'item', id })} onBadge={() => setSheet({ type: 'badge', id: screen.id })} onCheckout={() => go({ name: 'checkout' })}/>; break
    case 'checkout': body = <Checkout cart={cart} setCart={setCart} onBack={back} onPlace={placeOrder}/>; break
    case 'delivered': body = <Delivered order={order} onDone={() => setStack([{ name: 'home' }])} onHow={() => setSheet({ type: 'how' })}/>; break
    case 'return': body = <ReturnScreen entry={awaiting} onBack={back} onChoose={chooseReturn} onDropoff={() => go({ name: 'dropoff' })} onSimulate={simulateReturn}/>; break
    case 'dropoff': body = <DropoffScreen entry={awaiting} onBack={back} onChoose={m => { chooseReturn(m); back() }} onToast={setToast}/>; break
    case 'browse': body = <Browse onStore={id => go({ name: 'store', id })}/>; break
    case 'me': body = <Me onImpact={() => go({ name: 'impact' })} onReturn={() => go({ name: 'return' })} awaiting={awaiting} onToast={setToast} onReset={reset}/>; break
    case 'impact': body = <Impact history={history} onBack={back}/>; break
    default: body = <Home circular={circular} setCircular={setCircular} onStore={id => go({ name: 'store', id })} onToast={setToast} cartCount={cartCount}
      onCart={() => go({ name: 'checkout' })} hasNotice={notice} onBell={() => awaiting ? go({ name: 'return' }) : setToast('No new notifications')}/>
  }

  return <div className="cx-stage">
    <aside className="cx-side-note">
      <span className="cx-proto-tag">Concept prototype</span>
      <h1>Good Riddance</h1>
      <p>Customer screens for a delivery app. Sample data only; not affiliated with any delivery company.</p>
      <p className="cx-muted">Restaurant workspace: <a href="/">open</a></p>
    </aside>
    <div className="cx-phone">
      <div className="cx-screen">
        <div className="cx-status"><span>9:41</span><span className="cx-proto-mini">Concept prototype</span><span className="cx-status-icons"><i/><i/><i/></span></div>
        <div className="cx-scroll" key={stack.length + screen.name}>{body}</div>

        {notice && <button className="gr-notice" onClick={() => { setNotice(false); setStack([{ name: 'home' }, { name: 'return' }]) }}>
          <span className="gr-notice-icon"><Icon name="shell" size={20}/></span>
          <span><strong>Good Riddance · now</strong><span>Ready to return your shells? Tap to choose how.</span></span>
        </button>}

        {nextDayReady && screen.name === 'home' && !notice && <button className="cx-proto-skip" onClick={() => { setNextDayReady(false); setNotice(true) }}>Prototype: skip to the next day</button>}

        {showNav && <nav className="cx-nav" aria-label="Main">{TABS.map(([id, label, icon]) => <button key={id} className={rootTab === id ? 'on' : ''} aria-current={rootTab === id ? 'page' : undefined} onClick={() => tab(id)}><Icon name={icon} size={24}/><span>{label}</span></button>)}</nav>}

        {sheet?.type === 'badge' && <BadgeSheet store={storeById(sheet.id)} onClose={() => setSheet(null)}/>}
        {sheet?.type === 'item' && <ItemSheet item={itemById(sheet.id)} onClose={() => setSheet(null)} onAdd={addToCart}/>}
        {sheet?.type === 'how' && <HowSheet onClose={() => setSheet(null)}/>}
        {toast && <div className={`cx-toast ${showNav ? 'above-nav' : ''}`} role="status">{toast}</div>}
        <div className="cx-home-indicator"/>
      </div>
    </div>
  </div>
}

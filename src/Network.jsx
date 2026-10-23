import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import { askAgent } from './agent'
import ContactRun, { useContactFinder } from './ContactRun'
import { loadRestaurants } from './data'
import { restaurant as home, shellTotals, weeklyShells } from './shellData'

function formatPrice(price) {
  return price == null ? '' : `$${price.toFixed(2)}`
}

function formatMiles(miles) {
  return `${miles.toFixed(1)} mi`
}

const EARTH_RADIUS_MILES = 3958.8

// Straight-line (haversine) distance in miles.
function milesBetween(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(h))
}

// The facts the invite agent may use: this restaurant's DoorDash listing and our results.
function invitePrompt(place) {
  const totals = shellTotals(weeklyShells)
  return `Write the invite.\n${JSON.stringify({
    sender: { restaurant: home.name, owner: home.manager, location: `${home.city}, ${home.state}`, last12Weeks: { lbOfShellRecycled: totals.lb, pickups: totals.pickups, babyOysterHomes: totals.oysterHomes } },
    recipient: {
      restaurant: place.name,
      neighborhood: place.neighborhood,
      oysterDishes: place.oysterItems.map((o) => ({ name: o.name, price: o.price })),
      milesAway: place.miles == null ? null : Number(place.miles.toFixed(1)),
    },
  })}`
}

// A full-page Google map with the restaurant list floating over it.
export default function Network({ title, onToast }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  // Gemini-written invites by restaurant id: { status: 'writing' | 'ready' | 'failed', subject, body, error }
  const [invites, setInvites] = useState({})
  const [contacts, findContact] = useContactFinder()
  useEffect(() => { loadRestaurants().then(setData, (err) => setError(err.message)) }, [])

  async function draftInvite(place) {
    const save = (invite) => setInvites((all) => ({ ...all, [place.id]: invite }))
    save({ status: 'writing' })
    try {
      save({ status: 'ready', ...await askAgent('invite', invitePrompt(place)) })
    } catch (err) {
      save({ status: 'failed', error: err.message })
    }
  }
  function editInvite(id, changes) {
    setInvites((all) => ({ ...all, [id]: { ...all[id], ...changes } }))
  }
  async function copyInvite(place, invite) {
    try {
      await navigator.clipboard.writeText(`Subject: ${invite.subject}\n\n${invite.body}`)
      onToast(`Invite to ${place.name} copied. Nothing was sent.`)
    } catch {
      onToast('Your browser blocked copying. Select the text and copy it instead.')
    }
  }

  // Every restaurant, nearest first (any without coordinates last), numbered.
  const places = useMemo(() => (data?.restaurants ?? [])
    .map((r) => ({ ...r, miles: r.lat != null && r.lng != null ? milesBetween(home, r) : null }))
    .sort((a, b) => (a.miles ?? Infinity) - (b.miles ?? Infinity) || 0)
    .map((r, i) => ({ ...r, number: i + 1 })), [data])
  const selected = places.find((p) => p.id === selectedId) ?? places[0]

  let status = 'Loading restaurants…'
  if (error) status = `Couldn’t load restaurants: ${error}`
  else if (data) status = `${places.length} ${places.length === 1 ? 'restaurant' : 'restaurants'} · ${data.mock ? 'Mock data' : 'Data from DoorDash'}`

  return (
    <section className="map-view">
      <RestaurantMap place={selected} />
      <aside className="map-panel">
        <div className="map-panel-head">
          <h1>{title}</h1>
          <p className="muted">{status}</p>
          <p className="map-panel-purpose">These restaurants serve oysters. Invite them to recycle their shells with Billion Oyster Project, so more shells go back into New York Harbor.</p>
        </div>
        {places.map((p) => (
          <div key={p.id} className={`network-place ${p.id === selected?.id ? 'selected' : ''}`}>
            <button className="network-row" aria-pressed={p.id === selected?.id} onClick={() => setSelectedId(p.id)}>
              <span className="pin-badge">{p.number}</span>
              <span className="network-row-body">
                <strong>{p.name}</strong>
                {p.id !== selected?.id && <small>{p.oysterItems[0]?.name} · {formatPrice(p.oysterItems[0]?.price)}</small>}
              </span>
              <span className="network-distance">{p.miles == null ? '—' : formatMiles(p.miles)}</span>
            </button>
            {p.id === selected?.id && (
              <div className="network-place-details">
                <p className="muted">
                  {[p.street, p.neighborhood, p.rating != null && `★ ${p.rating} (${p.ratingCount})`].filter(Boolean).join(' · ')}
                </p>
                <p className="oyster-line">{p.oysterItems.map((o) => `${o.name} ${formatPrice(o.price)}`).join(' · ')}</p>
                <div className="network-place-actions">
                  {!invites[p.id] && <button className="button primary small" onClick={() => draftInvite(p)}><Icon name="mail" size={15} /> Invite to recycle</button>}
                  {!contacts[p.id] && <button className="button secondary small" onClick={() => findContact(p)}><Icon name="search" size={15} /> Find their email</button>}
                  <a className="text-link" href={p.doordashUrl} target="_blank" rel="noreferrer">DoorDash page <Icon name="arrow" size={13} /></a>
                </div>
                {contacts[p.id] && <ContactRun run={contacts[p.id]} onRetry={() => findContact(p)} />}
                {invites[p.id] && (
                  <InviteDraft
                    invite={invites[p.id]}
                    to={contacts[p.id]?.contact?.email}
                    onChange={(changes) => editInvite(p.id, changes)}
                    onCopy={() => copyInvite(p, invites[p.id])}
                    onRewrite={() => draftInvite(p)}
                  />
                )}
              </div>
            )}
          </div>
        ))}
        {data && (
          <p className="network-caveat">
            <Icon name="help" size={15} /> Straight-line distance from {home.name}. Listed from public DoorDash menus.
          </p>
        )}
      </aside>
    </section>
  )
}

// An invite Gemini wrote for one restaurant, editable before it's copied or emailed.
// It's addressed to the email the contact agent found, unless the owner types another.
function InviteDraft({ invite, to, onChange, onCopy, onRewrite }) {
  if (invite.status === 'writing') {
    return <p className="invite-draft invite-status" aria-live="polite"><span className="agent-pulse" /> Gemini is writing an invite from their DoorDash menu…</p>
  }
  if (invite.status === 'failed') {
    return (
      <div className="invite-draft" role="alert">
        <p className="form-error">Gemini couldn’t write the invite: {invite.error}</p>
        <button className="button secondary small" onClick={onRewrite}>Try again</button>
      </div>
    )
  }
  const recipient = invite.to ?? to ?? ''
  const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(invite.subject)}&body=${encodeURIComponent(invite.body)}`
  return (
    <form className="invite-draft" onSubmit={(e) => e.preventDefault()}>
      <p className="invite-status"><Icon name="sparkles" size={13} /> Written by Gemini from their DoorDash menu. Edit before sending.</p>
      <label>To<input type="email" value={recipient} placeholder="Find their email, or type it" onChange={(e) => onChange({ to: e.target.value })} /></label>
      <label>Subject<input value={invite.subject} onChange={(e) => onChange({ subject: e.target.value })} /></label>
      <label>Message<textarea rows={9} value={invite.body} onChange={(e) => onChange({ body: e.target.value })} /></label>
      <div className="network-place-actions">
        <a className="button primary small" href={mailto}><Icon name="mail" size={15} /> Open in email</a>
        <button type="button" className="button secondary small" onClick={onCopy}>Copy</button>
        <button type="button" className="text-button" onClick={onRewrite}>Rewrite</button>
      </div>
    </form>
  )
}

// Google Maps embed (needs no API key) showing the selected restaurant, or yours when none is listed.
function RestaurantMap({ place }) {
  const query = place?.street ? `${place.name}, ${place.street}, New York, NY`
    : place?.lat != null ? `${place.lat},${place.lng}`
    : `${home.street}, ${home.city}, ${home.state}`
  return (
    <iframe
      className="network-map"
      title={`Map of ${place?.name ?? home.name}`}
      src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  )
}

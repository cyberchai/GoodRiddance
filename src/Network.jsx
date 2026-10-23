import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import { loadRestaurants } from './data'
import { restaurant as home } from './shellData'

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

export default function Network({ onInvite }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  useEffect(() => { loadRestaurants().then(setData, (err) => setError(err.message)) }, [])

  // Every restaurant, nearest first (any without coordinates last, unpinned), numbered like their map pins.
  const places = useMemo(() => (data?.restaurants ?? [])
    .map((r) => ({ ...r, miles: r.lat != null && r.lng != null ? milesBetween(home, r) : null }))
    .sort((a, b) => (a.miles ?? Infinity) - (b.miles ?? Infinity) || 0)
    .map((r, i) => ({ ...r, number: i + 1 })), [data])

  if (error) return <div className="card empty"><Icon name="pin" size={28} /><h2>Couldn’t load restaurants</h2><p>{error}</p></div>
  if (!data) return <div className="card empty"><Icon name="clock" size={28} /><h2>Loading restaurants…</h2></div>

  const selected = places.find((p) => p.id === selectedId) ?? places[0]

  return (
    <section className="card network">
      <div className="network-map-panel">
        <div className="map-toolbar">
          <span><Icon name="pin" size={15} /> New York City</span>
          <span className="muted">{data.mock ? 'Mock data' : 'Data from DoorDash'}</span>
        </div>
        <RestaurantMap place={selected} />
        {selected && (
          <div className="map-selection">
            <span className="pin-badge">{selected.number}</span>
            <div className="map-selection-body">
              <strong>{selected.name}</strong>
              <p className="muted">
                {[selected.street, selected.neighborhood, selected.miles != null && formatMiles(selected.miles),
                  selected.rating != null && `★ ${selected.rating} (${selected.ratingCount})`].filter(Boolean).join(' · ')}
              </p>
              <p className="oyster-line">{selected.oysterItems.map((o) => `${o.name} ${formatPrice(o.price)}`).join(' · ')}</p>
            </div>
            <div className="map-selection-actions">
              <button className="button primary small" onClick={() => onInvite(selected.name)}><Icon name="mail" size={15} /> Invite to recycle</button>
              <a className="text-link" href={selected.doordashUrl} target="_blank" rel="noreferrer">DoorDash page <Icon name="arrow" size={13} /></a>
            </div>
          </div>
        )}
      </div>

      <aside className="network-list">
        <div className="network-list-title">
          <h2>Restaurants serving oysters</h2>
          <span className="muted">{places.length} restaurants on DoorDash</span>
        </div>
        {places.map((p) => (
          <button key={p.id} className={`network-row ${p.id === selected?.id ? 'selected' : ''}`} aria-pressed={p.id === selected?.id} onClick={() => setSelectedId(p.id)}>
            <span className="pin-badge">{p.number}</span>
            <span className="network-row-body">
              <strong>{p.name}</strong>
              <small>{p.oysterItems[0]?.name} · {formatPrice(p.oysterItems[0]?.price)}</small>
            </span>
            <span className="network-distance">{p.miles == null ? '—' : formatMiles(p.miles)}</span>
          </button>
        ))}
        <p className="network-caveat">
          <Icon name="help" size={15} /> Straight-line distance from {home.name}. Listed from public DoorDash menus; no restaurant has agreed to join yet.
        </p>
      </aside>
    </section>
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

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

// A full-page Google map with the restaurant list floating over it.
export default function Network({ title, onInvite }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  useEffect(() => { loadRestaurants().then(setData, (err) => setError(err.message)) }, [])

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
                  <button className="button primary small" onClick={() => onInvite(p.name)}><Icon name="mail" size={15} /> Invite to recycle</button>
                  <a className="text-link" href={p.doordashUrl} target="_blank" rel="noreferrer">DoorDash page <Icon name="arrow" size={13} /></a>
                </div>
              </div>
            )}
          </div>
        ))}
        {data && (
          <p className="network-caveat">
            <Icon name="help" size={15} /> Straight-line distance from {home.name}. Listed from public DoorDash menus; no restaurant has agreed to join yet.
          </p>
        )}
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

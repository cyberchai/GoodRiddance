import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
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
  const pinned = useMemo(() => places.filter((p) => p.miles != null), [places])

  if (error) return <div className="card empty"><Icon name="pin" size={28} /><h2>Couldn’t load restaurants</h2><p>{error}</p></div>
  if (!data) return <div className="card empty"><Icon name="clock" size={28} /><h2>Loading restaurants…</h2></div>

  const selected = places.find((p) => p.id === selectedId) ?? places[0]

  return (
    <section className="card network">
      <div className="network-map-panel">
        <div className="map-toolbar">
          <span><Icon name="pin" size={15} /> New York City</span>
          <span className="muted">{data.mock ? 'Mock data' : 'Live DoorDash data'}</span>
        </div>
        <RestaurantMap places={pinned} selectedId={selected?.id} onSelect={setSelectedId} />
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

const homeIcon = L.divIcon({ className: 'home-pin', html: '<span>H</span><small>Your restaurant</small>', iconSize: [36, 36], iconAnchor: [18, 18] })

function pinIcon(number) {
  return L.divIcon({ className: 'map-pin', html: `<span>${number}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] })
}

// Leaflet map on OpenStreetMap tiles: your restaurant plus one numbered pin per place.
function RestaurantMap({ places, selectedId, onSelect }) {
  const containerRef = useRef(null)
  const markersRef = useRef(new Map())

  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomSnap: 0.25 })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
    L.marker([home.lat, home.lng], { icon: homeIcon, title: home.name, keyboard: false }).addTo(map)
    markersRef.current = new Map(places.map((p) => [
      p.id,
      L.marker([p.lat, p.lng], { icon: pinIcon(p.number), title: p.name, alt: p.name }).on('click', () => onSelect(p.id)).addTo(map),
    ]))
    map.invalidateSize()
    if (places.length) map.fitBounds([[home.lat, home.lng], ...places.map((p) => [p.lat, p.lng])], { paddingTopLeft: [36, 36], paddingBottomRight: [36, 60] })
    else map.setView([home.lat, home.lng], 13)
    return () => map.remove()
  }, [places, onSelect])

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const isSelected = id === selectedId
      marker.getElement()?.classList.toggle('selected', isSelected)
      marker.setZIndexOffset(isSelected ? 1000 : 0)
    }
  }, [places, selectedId])

  return <div ref={containerRef} className="network-map" role="region" aria-label="Map of restaurants serving oysters" />
}

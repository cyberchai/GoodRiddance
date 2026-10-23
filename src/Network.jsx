import { useEffect, useState } from 'react'
import Icon from './Icon'
import { loadRestaurants } from './data'

function formatPrice(price) {
  return price == null ? '' : `$${price.toFixed(2)}`
}

export default function Network({ onInvite }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { loadRestaurants().then(setData, (err) => setError(err.message)) }, [])

  if (error) return <div className="card empty"><Icon name="pin" size={28} /><h2>Couldn’t load restaurants</h2><p>{error}</p></div>
  if (!data) return <div className="card empty"><Icon name="clock" size={28} /><h2>Loading restaurants…</h2></div>

  return (
    <>
      <p className="source-note"><span className="status-dot" /> {data.restaurants.length} restaurants · {data.source}</p>
      <div className="network-grid">
        {data.restaurants.map((r) => (
          <article className="card restaurant-card" key={r.id}>
            <div className="restaurant-card-head">
              <h2>{r.name}</h2>
              {r.rating != null && <span className="rating">★ {r.rating} <span className="muted">({r.ratingCount})</span></span>}
            </div>
            <p className="muted">{[r.street, r.neighborhood].filter(Boolean).join(' · ')}</p>
            <ul className="oyster-items">
              {r.oysterItems.map((o) => <li key={o.name}><span>{o.name}</span><span className="price">{formatPrice(o.price)}</span></li>)}
            </ul>
            <div className="card-actions">
              <button className="button primary small" onClick={() => onInvite(r.name)}><Icon name="mail" size={15} /> Invite to recycle</button>
              <a className="text-link" href={r.doordashUrl} target="_blank" rel="noreferrer">DoorDash page <Icon name="arrow" size={13} /></a>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

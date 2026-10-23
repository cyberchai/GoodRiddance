import { useEffect, useState } from 'react'
import { loadRestaurants } from './data.js'
import './App.css'

function formatPrice(price) {
  return price == null ? '' : `$${price.toFixed(2)}`
}

function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadRestaurants().then(setData, (err) => setError(err.message))
  }, [])

  if (error) return <p className="status">Couldn't load restaurants: {error}</p>
  if (!data) return <p className="status">Loading…</p>

  return (
    <main>
      <header>
        <h1>{data.title}</h1>
        <p className="source">{data.source}</p>
      </header>

      <section className="restaurants">
        {data.restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </section>

      {data.checkedWithoutOysters.length > 0 && (
        <section className="checked">
          <h2>Checked, but no oysters on the delivery menu</h2>
          <ul>
            {data.checkedWithoutOysters.map((r) => (
              <li key={r.id}>
                <a href={r.doordashUrl} target="_blank" rel="noreferrer">
                  {r.name}
                </a>
                {r.street && ` · ${r.street}`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

function RestaurantCard({ restaurant: r }) {
  const itemCount = r.menu.reduce((n, section) => n + section.items.length, 0)

  return (
    <article className="card">
      <h2>{r.name}</h2>
      <p className="meta">
        {[r.street, r.neighborhood].filter(Boolean).join(' · ')}
      </p>
      <p className="meta">
        {[r.rating != null && `★ ${r.rating} (${r.ratingCount})`, r.priceRange]
          .filter(Boolean)
          .join(' · ')}
      </p>

      <ul className="oysters">
        {r.oysterItems.map((item) => (
          <li key={item.name}>
            <div className="item-line">
              <span className="item-name">{item.name}</span>
              <span className="price">{formatPrice(item.price)}</span>
            </div>
            {item.description && <p className="desc">{item.description}</p>}
          </li>
        ))}
      </ul>

      <details>
        <summary>Full delivery menu ({itemCount} items)</summary>
        {r.menu.map((section, i) => (
          <div key={i} className="menu-section">
            <h3>{section.section}</h3>
            <ul>
              {section.items.map((item, j) => (
                <li key={j} className="item-line">
                  <span className="item-name">{item.name}</span>
                  <span className="price">{formatPrice(item.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </details>

      <a className="dd-link" href={r.doordashUrl} target="_blank" rel="noreferrer">
        View on DoorDash →
      </a>
    </article>
  )
}

export default App

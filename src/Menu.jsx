import { useState } from 'react'
import Icon from './Icon'
import { menuPhotos } from './menuPhotos'
import { menu, menuCategories } from './shellData'

function itemsIn(category) {
  return category === 'All' ? menu : menu.filter((item) => item.category === category)
}

export default function Menu({ soldOut, onToggle }) {
  const [category, setCategory] = useState('All')
  const sections = category === 'All' ? menuCategories : [category]

  return (
    <section className="card pos-menu">
      <div className="pos-toolbar">
        <div className="category-tabs">
          {['All', ...menuCategories].map((c) => (
            <button key={c} className={c === category ? 'selected' : ''} aria-pressed={c === category} onClick={() => setCategory(c)}>
              {c}<span>{itemsIn(c).length}</span>
            </button>
          ))}
        </div>
        <span className="muted">{menu.length - soldOut.length} of {menu.length} in stock</span>
      </div>

      {sections.map((c) => (
        <div key={c} className="pos-section">
          <h2>{c}</h2>
          <ul className="menu-cards">
            {itemsIn(c).map((item) => (
              <MenuCard key={item.id} item={item} inStock={!soldOut.includes(item.id)} onToggle={() => onToggle(item.id)} />
            ))}
          </ul>
        </div>
      ))}

      <details className="photo-credits">
        <summary>Photo credits</summary>
        <ul>
          {menu.filter((item) => menuPhotos[item.id]).map((item) => {
            const photo = menuPhotos[item.id]
            return <li key={item.id}>{item.name}: <a href={photo.page} target="_blank" rel="noreferrer">{photo.author}</a>, {photo.license}, via Wikimedia Commons</li>
          })}
        </ul>
      </details>
    </section>
  )
}

function MenuCard({ item, inStock, onToggle }) {
  const photo = menuPhotos[item.id]
  return (
    <li className={`menu-card ${inStock ? '' : 'sold-out'}`}>
      <div className="menu-card-photo">
        {photo && <img src={photo.src} alt="" loading="lazy" />}
        {item.shellsPerWeek > 0 && <span className="chip eligible-chip"><Icon name="recycle" size={12} /> Shells → BOP</span>}
        {!inStock && <span className="sold-out-badge">86’d</span>}
      </div>
      <div className="menu-card-body">
        <div className="menu-card-title">
          <strong>{item.name}</strong>
          <span className="price">${item.price.toFixed(2)}</span>
        </div>
        <small>{item.detail}</small>
        <button className={`switch ${inStock ? 'on' : ''}`} role="switch" aria-checked={inStock} aria-label={`${item.name} in stock`} onClick={onToggle}>
          <span className="switch-label">{inStock ? 'In stock' : '86’d'}</span>
          <span className="switch-track"><i /></span>
        </button>
      </div>
    </li>
  )
}

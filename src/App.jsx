import { useEffect, useState } from 'react'
import Icon from './Icon'
import Overview from './Overview'
import Pickups from './Pickups'
import Grants from './Grants'
import Network from './Network'
import { assess, programs } from './grantPrograms'
import { bop, readSchedule, restaurant, writeSchedule } from './shellData'
import './App.css'

const pages = {
  overview: {
    label: 'Overview', icon: 'shore', title: 'Every shell back to the harbor.',
    blurb: `${restaurant.name} recycles its oyster shells with ${bop.name}, the nonprofit restoring New York Harbor’s reefs.`,
  },
  pickups: {
    label: 'Pickups', icon: 'truck', title: 'Shell pickups',
    blurb: 'Set a recurring pickup. A BOP truck or a DoorDash Dasher takes your shells to BOP’s transfer station.',
  },
  grants: {
    label: 'Grants', icon: 'receipt', title: 'Grants & incentives',
    blurb: 'The Gemini agent finds programs you’re eligible for, fills in the application, and waits for your approval.',
  },
  network: {
    label: 'NYC network', icon: 'pin', title: 'Oyster restaurants in NYC',
    blurb: `Restaurants serving oysters on DoorDash that could recycle their shells with ${bop.name}.`,
  },
}
const aliases = { oysters: 'network' }

function pageFromHash() {
  const id = location.hash.slice(1)
  if (Object.hasOwn(pages, id)) return id
  return Object.hasOwn(aliases, id) ? aliases[id] : 'overview'
}

export default function App() {
  const [page, setPage] = useState(pageFromHash)
  const [schedule, setSchedule] = useState(readSchedule)
  const [decisions, setDecisions] = useState({})
  const [toast, setToast] = useState('')

  useEffect(() => {
    const sync = () => { setPage(pageFromHash()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  function saveSchedule(next) {
    setSchedule(next)
    setToast(writeSchedule(next) ? 'Pickup schedule saved.' : 'Saved for this visit only. Your browser blocked local storage.')
  }
  function decide(program, decision) {
    setDecisions({ ...decisions, [program.id]: decision })
    if (decision === 'approved') setToast(`Approved. The ${program.name} application is queued. Nothing was sent (mock).`)
  }
  function invite(name) {
    setToast(`Invite to ${name} drafted. Nothing was sent (mock).`)
  }

  const pendingGrants = programs.filter((p) => assess(p, restaurant).eligible && !decisions[p.id]).length
  const current = pages[page]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview">
          <img src="/brand/doordash-logo.jpg" alt="" className="brand-logo" />
          <span>DOORDASH<small>Merchant Portal</small></span>
        </a>
        <div className="store">
          <span className="store-avatar">H</span>
          <span><strong>{restaurant.name}</strong><small>{restaurant.city}, {restaurant.state}</small></span>
        </div>
        <nav aria-label="GoodRiddance">
          <span className="nav-label">SHELL RECYCLING</span>
          {Object.entries(pages).map(([id, p]) => (
            <a key={id} href={`#${id}`} className={`nav-item ${page === id ? 'active' : ''}`} aria-current={page === id ? 'page' : undefined}>
              <Icon name={p.icon} size={18} />
              {p.label}
              {id === 'grants' && pendingGrants > 0 && <span className="nav-count" aria-label={`${pendingGrants} awaiting approval`}>{pendingGrants}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="integration">
            <Icon name="leaf" size={16} />
            <span><strong>{bop.name}</strong><small>Connected via GoodRiddance</small></span>
            <span className="status-dot" />
          </div>
          <div className="profile">
            <span className="avatar">RO</span>
            <span><strong>{restaurant.manager}</strong><small>Restaurant manager</small></span>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="crumbs">Merchant Portal <Icon name="chevron" size={13} /><strong>{current.label}</strong></div>
          <div className="topbar-right">
            <span className="prototype-pill"><span /> Prototype · mock data</span>
            <span className="avatar small">RO</span>
          </div>
        </header>

        <main>
          <div className="page-heading">
            <p className="eyebrow">{restaurant.name} · {restaurant.city}, {restaurant.state}</p>
            <h1>{current.title}</h1>
            <p>{current.blurb}</p>
          </div>
          {page === 'overview' && <Overview schedule={schedule} pendingGrants={pendingGrants} />}
          {page === 'pickups' && <Pickups schedule={schedule} onSave={saveSchedule} />}
          {page === 'grants' && <Grants decisions={decisions} onDecide={decide} />}
          {page === 'network' && <Network onInvite={invite} />}
        </main>

        <footer>
          <span>DoorDash Merchant Portal · Prototype</span>
          <span>GoodRiddance × {bop.name}</span>
        </footer>
      </div>

      <div className="toast-region" role="status" aria-live="polite">{toast && <div className="toast">{toast}</div>}</div>
    </div>
  )
}

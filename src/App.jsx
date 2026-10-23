import { useEffect, useState } from 'react'
import Icon from './Icon'
import Menu from './Menu'
import Pickups from './Pickups'
import Analytics from './Analytics'
import Grants from './Grants'
import Network from './Network'
import ProfileMenu from './ProfileMenu'
import { opportunities } from './opportunities'
import { bop, readSchedule, restaurant, writeSchedule } from './shellData'
import './App.css'

const pages = {
  menu: {
    label: 'Menu', icon: 'menu', title: 'Menu',
    blurb: `Your DoorDash menu. Shells from oyster dishes are picked up for ${bop.name}.`,
  },
  pickups: {
    label: 'Pickups', icon: 'truck', title: 'Shell pickups',
    blurb: 'Set a recurring pickup. A BOP truck or a DoorDash Dasher takes your shells to BOP’s transfer station.',
  },
  analytics: {
    label: 'Analytics', icon: 'chart', title: 'Your shell impact',
    blurb: `How much oyster shell ${restaurant.name} has sent to ${bop.name}.`,
  },
  grants: {
    label: 'Grants', icon: 'receipt', title: 'Grants & press',
    blurb: 'An agent applies to grants and press you qualify for, using your shell data. You approve each one.',
  },
  network: {
    label: 'NYC network', icon: 'pin', title: 'Oyster restaurants in NYC',
    blurb: `Restaurants serving oysters on DoorDash that could recycle their shells with ${bop.name}.`,
  },
}
const defaultPage = 'menu'
const aliases = { oysters: 'network', overview: 'analytics' }

function pageFromHash() {
  const id = location.hash.slice(1)
  if (Object.hasOwn(pages, id)) return id
  return Object.hasOwn(aliases, id) ? aliases[id] : defaultPage
}

const profileMessages = {
  switch: `${restaurant.name} is the only store in this prototype.`,
  signout: 'Signing out is turned off in this prototype.',
  settings: 'Settings aren’t part of this prototype.',
  help: 'Help isn’t part of this prototype.',
}

export default function App() {
  const [page, setPage] = useState(pageFromHash)
  const [schedule, setSchedule] = useState(readSchedule)
  const [soldOut, setSoldOut] = useState([])
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
  function toggleStock(id) {
    setSoldOut(soldOut.includes(id) ? soldOut.filter((x) => x !== id) : [...soldOut, id])
  }
  function decide(opportunity, decision) {
    setDecisions({ ...decisions, [opportunity.id]: decision })
    if (decision === 'approved') setToast(`Approved. ${opportunity.name} is marked as submitted. Nothing was sent (mock).`)
  }
  function invite(name) {
    setToast(`Invite to ${name} drafted. Nothing was sent (mock).`)
  }

  const pendingGrants = opportunities.filter((o) => o.status === 'ready' && !decisions[o.id]).length
  const current = pages[page]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href={`#${defaultPage}`}>
          <img src="/brand/doordash-logo.jpg" alt="" className="brand-logo" />
          <span>DOORDASH<small>Merchant Portal</small></span>
        </a>
        <nav aria-label="Merchant Portal">
          {Object.entries(pages).map(([id, p]) => (
            <a key={id} href={`#${id}`} className={`nav-item ${page === id ? 'active' : ''}`} aria-current={page === id ? 'page' : undefined}>
              <Icon name={p.icon} size={18} />
              {p.label}
              {id === 'grants' && pendingGrants > 0 && <span className="nav-count" aria-label={`${pendingGrants} awaiting approval`}>{pendingGrants}</span>}
            </a>
          ))}
        </nav>
        <div className="integration">
          <Icon name="leaf" size={16} />
          <span><strong>Connected via GoodRiddance</strong></span>
          <span className="status-dot" />
        </div>
        <div className="sidebar-links">
          <button onClick={() => setToast(profileMessages.settings)}><Icon name="settings" size={16} /> Settings</button>
          <button onClick={() => setToast(profileMessages.help)}><Icon name="help" size={16} /> Help</button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="crumbs">Merchant Portal <Icon name="chevron" size={13} /><strong>{current.label}</strong></div>
          <div className="topbar-right">
            <span className="prototype-pill"><span /> Prototype · mock data</span>
            <ProfileMenu onAction={(action) => setToast(profileMessages[action])} />
          </div>
        </header>

        <main>
          <div className="page-heading">
            <p className="eyebrow">{restaurant.name} · {restaurant.city}, {restaurant.state}</p>
            <h1>{current.title}</h1>
            <p>{current.blurb}</p>
          </div>
          {page === 'menu' && <Menu soldOut={soldOut} onToggle={toggleStock} />}
          {page === 'pickups' && <Pickups schedule={schedule} onSave={saveSchedule} />}
          {page === 'analytics' && <Analytics schedule={schedule} />}
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

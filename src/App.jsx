import { useEffect, useState } from 'react'
import Icon from './Icon'
import Menu from './Menu'
import Pickups from './Pickups'
import GoodRiddance from './GoodRiddance'
import Grants from './Grants'
import Network from './Network'
import ProfileMenu from './ProfileMenu'
import { useGrantDrafts } from './grantAgent'
import { isEligible, opportunities } from './opportunities'
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
  grants: {
    label: 'Grants', icon: 'receipt', title: 'Grants & press',
    blurb: 'A Gemini agent drafts applications for the grants and press you qualify for, using your shell data. You approve each one.',
  },
  network: {
    label: 'NYC network', icon: 'pin', title: 'Oyster restaurants in NYC',
    blurb: `Restaurants serving oysters on DoorDash that could recycle their shells with ${bop.name}.`,
  },
  // The "Connected via GoodRiddance" entry in the sidebar.
  goodriddance: {
    label: 'GoodRiddance', title: 'GoodRiddance',
    blurb: `How much oyster shell ${restaurant.name} has sent to ${bop.name}.`,
  },
}
const defaultPage = 'menu'
// Sidebar groups: DoorDash's own pages, then the pages GoodRiddance runs, nested under its connection.
const doordashPages = ['menu']
const goodriddancePages = ['pickups', 'grants', 'network']
const aliases = { oysters: 'network', overview: 'goodriddance', analytics: 'goodriddance' }

function pageFromHash() {
  const id = location.hash.slice(1)
  if (Object.hasOwn(pages, id)) return id
  return Object.hasOwn(aliases, id) ? aliases[id] : defaultPage
}

const profileMessages = {
  switch: `${restaurant.name} is your only store.`,
  signout: 'Signing out isn’t available yet.',
  settings: 'Settings aren’t available yet.',
  help: 'Help isn’t available yet.',
}

export default function App() {
  const [page, setPage] = useState(pageFromHash)
  const [schedule, setSchedule] = useState(readSchedule)
  const [soldOut, setSoldOut] = useState([])
  const [decisions, setDecisions] = useState({})
  const [toast, setToast] = useState('')
  const [connected, setConnected] = useState(true)
  const grantAgent = useGrantDrafts()
  const { draftAll } = grantAgent

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
  // The agent starts on everything the restaurant is eligible for once the owner opens Grants.
  useEffect(() => {
    if (page === 'grants') draftAll(opportunities.filter((o) => o.status === 'ready' && !decisions[o.id] && isEligible(o)))
  }, [page, decisions, draftAll])

  function saveSchedule(next) {
    setSchedule(next)
    setToast(writeSchedule(next) ? 'Pickup schedule saved.' : 'Saved for this visit only. Your browser blocked local storage.')
  }
  function toggleStock(id) {
    setSoldOut(soldOut.includes(id) ? soldOut.filter((x) => x !== id) : [...soldOut, id])
  }
  function decide(opportunity, decision) {
    setDecisions({ ...decisions, [opportunity.id]: decision })
    if (decision === 'declined') grantAgent.stop(opportunity.id)
    if (decision === 'approved') setToast(`Approved. ${opportunity.name} is marked as submitted. Nothing was sent (mock).`)
  }
  function toggleConnection() {
    setConnected(!connected)
    setToast(connected ? 'Disconnected from GoodRiddance (mock).' : 'Connected to GoodRiddance (mock).')
  }
  function navLink(id) {
    return (
      <a key={id} href={`#${id}`} className={`nav-item ${page === id ? 'active' : ''}`} aria-current={page === id ? 'page' : undefined}>
        <Icon name={pages[id].icon} size={18} />
        {pages[id].label}
        {id === 'grants' && pendingGrants > 0 && <span className="nav-count" aria-label={`${pendingGrants} awaiting approval`}>{pendingGrants}</span>}
      </a>
    )
  }

  const pendingGrants = opportunities.filter((o) => o.status === 'ready' && !decisions[o.id]).length
  const current = pages[page]
  const isGoodriddancePage = goodriddancePages.includes(page)
  // NYC network is a full-page map, with no heading or footer around it.
  const fullBleed = page === 'network'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href={`#${defaultPage}`}>
          <img src="/brand/doordash-logo.jpg" alt="" className="brand-logo" />
          <span>DOORDASH<small>Merchant Portal</small></span>
        </a>
        <nav aria-label="Merchant Portal">{doordashPages.map(navLink)}</nav>
        <div className="integration">
          <a href="#goodriddance" className={`nav-item ${page === 'goodriddance' ? 'active' : ''}`} aria-current={page === 'goodriddance' ? 'page' : undefined}>
            <img src="/brand/goodriddance-logo.png" alt="" className="integration-logo" />
            <span><strong>{connected ? 'Connected via GoodRiddance' : 'GoodRiddance'}</strong>{!connected && <small>Not connected</small>}</span>
            <span className={`status-dot ${connected ? '' : 'off'}`} />
          </a>
          <nav className="subnav" aria-label="GoodRiddance">{goodriddancePages.map(navLink)}</nav>
        </div>
        <div className="sidebar-links">
          <button onClick={() => setToast(profileMessages.settings)}><Icon name="settings" size={16} /> Settings</button>
          <button onClick={() => setToast(profileMessages.help)}><Icon name="help" size={16} /> Help</button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="crumbs">
            Merchant Portal <Icon name="chevron" size={13} />
            {isGoodriddancePage && <>GoodRiddance <Icon name="chevron" size={13} /></>}
            <strong>{current.label}</strong>
          </div>
          <div className="topbar-right">
            <ProfileMenu onAction={(action) => setToast(profileMessages[action])} />
          </div>
        </header>

        <main className={fullBleed ? 'map-page' : undefined}>
          {!fullBleed && <div className="page-heading">
            <p className="eyebrow">{restaurant.name} · {restaurant.city}, {restaurant.state}</p>
            <h1>{current.title}</h1>
            <p>{current.blurb}</p>
          </div>}
          {page === 'menu' && <Menu soldOut={soldOut} onToggle={toggleStock} />}
          {page === 'pickups' && <Pickups schedule={schedule} onSave={saveSchedule} />}
          {page === 'grants' && <Grants decisions={decisions} onDecide={decide} agent={grantAgent} />}
          {page === 'network' && <Network title={current.title} onToast={setToast} />}
          {page === 'goodriddance' && <GoodRiddance connected={connected} onToggle={toggleConnection} schedule={schedule} />}
        </main>

        {!fullBleed && <footer>
          <span>DoorDash Merchant Portal</span>
          <span>GoodRiddance × {bop.name}</span>
        </footer>}
      </div>

      <div className="toast-region" role="status" aria-live="polite">{toast && <div className="toast">{toast}</div>}</div>
    </div>
  )
}

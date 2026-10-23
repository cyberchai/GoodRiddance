import Analytics from './Analytics'

export default function GoodRiddance({ connected, onToggle, schedule }) {
  return (
    <>
      <section className="card connection">
        <img src="/brand/goodriddance-logo.png" alt="" className="connection-logo" />
        <div>
          <h2>GoodRiddance</h2>
          <p className="muted">{connected ? 'Connected. Your shell pickups and impact sync automatically.' : 'Not connected. Connect to sync your shell pickups and impact.'}</p>
        </div>
        <button className={`button ${connected ? 'secondary' : 'primary'}`} onClick={onToggle}>{connected ? 'Disconnect' : 'Connect'}</button>
      </section>
      {connected && <Analytics schedule={schedule} />}
    </>
  )
}

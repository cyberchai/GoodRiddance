import './ViewSwitch.css'

// Floating pill for demos: jump between the restaurant workspace (/) and the customer prototype (/customer).
// Lives outside both apps so neither one's code has to know about it.
export default function ViewSwitch({ current }) {
  const views = [['restaurant', '/', 'Restaurant view'], ['customer', '/customer', 'Customer view']]
  return <nav className={`view-switch on-${current}`} aria-label="Switch prototype view">
    {views.map(([id, href, label]) => <a key={id} href={href} className={current === id ? 'on' : ''} aria-current={current === id ? 'page' : undefined}>{label}</a>)}
  </nav>
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ViewSwitch from './ViewSwitch.jsx'

// /customer opens the customer-side prototype; everything else is the restaurant workspace.
// One loader per view: written as a single `a ? import(x) : import(y)`, the minifier merged
// the two loads and dropped the customer stylesheet.
const loaders = {
  customer: () => import('./customer/CustomerApp.jsx'),
  restaurant: () => import('./App.jsx'),
}
const view = location.pathname.startsWith('/customer') ? 'customer' : 'restaurant'

loaders[view]().then(({ default: Root }) => createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
    <ViewSwitch current={view} />
  </StrictMode>,
))

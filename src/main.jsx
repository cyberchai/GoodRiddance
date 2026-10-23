import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ViewSwitch from './ViewSwitch.jsx'

// /customer opens the customer-side prototype; everything else is the restaurant workspace.
const isCustomer = location.pathname.startsWith('/customer')
const load = isCustomer ? import('./customer/CustomerApp.jsx') : import('./App.jsx')

load.then(({ default: Root }) => createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
    <ViewSwitch current={isCustomer ? 'customer' : 'restaurant'} />
  </StrictMode>,
))

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// /customer opens the customer-side prototype; everything else is the restaurant workspace.
const load = location.pathname.startsWith('/customer') ? import('./customer/CustomerApp.jsx') : import('./App.jsx')

load.then(({ default: Root }) => createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
))

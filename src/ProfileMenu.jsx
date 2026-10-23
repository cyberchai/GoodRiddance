import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { restaurant } from './shellData'

// Top-right store and profile selector.
export default function ProfileMenu({ onAction }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function closeOnOutsidePointer(e) {
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    function closeOnEscape(e) {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current.focus()
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  function choose(action) {
    setOpen(false)
    onAction(action)
  }

  return (
    <div className="profile-menu" ref={rootRef}>
      <button ref={buttonRef} className="profile-button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="store-avatar">H</span>
        <span className="profile-button-text"><strong>{restaurant.name}</strong><small>{restaurant.city}, {restaurant.state}</small></span>
        <Icon name={open ? 'up' : 'down'} size={15} />
      </button>
      {open && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-row">
            <span className="avatar">RO</span>
            <span><strong>{restaurant.manager}</strong><small>{restaurant.role}</small></span>
          </div>
          <div className="profile-dropdown-row current-store">
            <span className="store-avatar">H</span>
            <span><strong>{restaurant.name}</strong><small>{restaurant.street}, {restaurant.city}, {restaurant.state}</small></span>
            <Icon name="check" size={15} />
          </div>
          <button onClick={() => choose('switch')}>Switch store</button>
          <button onClick={() => choose('signout')}>Sign out</button>
        </div>
      )}
    </div>
  )
}

import { NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'

const LINKS = [
  { to: '/admin', label: 'Overview', icon: '📊', end: true },
  { to: '/admin/appointments', label: 'Appointments', icon: '📅', end: false },
  { to: '/admin/services', label: 'Services', icon: '🦷', end: false },
  { to: '/admin/hours', label: 'Business Hours', icon: '🕘', end: false },
  { to: '/admin/blocked-dates', label: 'Blocked Dates', icon: '🚫', end: false },
  { to: '/admin/settings', label: 'Clinic Settings', icon: '⚙️', end: false },
]

export default function Sidebar() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden>
          🦷
        </span>
        <span>Clinic Admin</span>
      </div>
      <nav aria-label="Admin">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
          >
            <span className="ico" aria-hidden>
              {l.icon}
            </span>
            <span className="txt">{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="who" title={email ?? ''}>
          {email ?? 'Admin'}
        </div>
        <button className="signout-btn" onClick={signOut}>
          Sign out
        </button>
      </div>
    </aside>
  )
}

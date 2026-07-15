import { NavLink } from 'react-router-dom'
import AccessibilityBar from './AccessibilityBar.jsx'
import { useProfile } from '../context/ProfileContext.jsx'

const MODULES = [
  { to: '/adhd', icon: '🎯', label: 'ADHD', cond: 'adhd' },
  { to: '/dyslexia', icon: '📖', label: 'Dyslexia', cond: 'dyslexia' },
  { to: '/brainfog', icon: '🌥️', label: 'Brain Fog', cond: 'brainfog' },
  { to: '/amnesia', icon: '🧠', label: 'Memory', cond: 'amnesia' },
  { to: '/autism', icon: '🧩', label: 'Autism', cond: 'autism' },
]

export default function Layout({ children }) {
  const { profile } = useProfile()
  const conds = profile?.conditions || []
  // Put the user's chosen areas at the top of the list.
  const ordered = [...MODULES].sort(
    (a, b) => (conds.includes(b.cond) ? 1 : 0) - (conds.includes(a.cond) ? 1 : 0),
  )

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><span className="logo">🧠</span> MindGym</div>
        <nav className="nav" aria-label="Main navigation">
          <NavLink to="/" end><span className="ico">🏠</span> Dashboard</NavLink>
          <NavLink to="/progress"><span className="ico">📈</span> Progress</NavLink>

          <div className="group-label">Your gyms</div>
          {ordered.map((m) => (
            <NavLink key={m.to} to={m.to}>
              <span className="ico">{m.icon}</span>
              <span>{m.label}</span>
              {conds.includes(m.cond) && (
                <span className="badge" style={{ marginLeft: 'auto' }} title="In your plan">★</span>
              )}
            </NavLink>
          ))}

          <div className="group-label">Setup</div>
          <NavLink to="/onboarding"><span className="ico">⚙️</span> My profile</NavLink>
        </nav>
      </aside>

      <div className="main">
        <AccessibilityBar />
        <main className="content">{children}</main>
      </div>
    </div>
  )
}

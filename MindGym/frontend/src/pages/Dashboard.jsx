import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useProfile } from '../context/ProfileContext.jsx'
import { Loading } from '../components/ui.jsx'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { profile } = useProfile()
  const [rec, setRec] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/recommendations').then(setRec).catch(() => {})
    api.get('/stats').then(setStats).catch(() => {})
  }, [])

  if (!rec || !stats) return <Loading />

  return (
    <div>
      <h1>{greeting()}, {profile?.name || 'Friend'} 👋</h1>
      <p className="lead">
        {rec.rough_day
          ? 'Looks like today might be a tougher one. I’ve picked gentler exercises — go easy on yourself. 💚'
          : 'Here’s your plan for today. Small steps count. Pick anything that feels right.'}
      </p>

      {/* Stats strip */}
      <div className="grid cols" style={{ marginBottom: 22 }}>
        <Stat icon="🔥" label="Day streak" value={stats.streak} />
        <Stat icon="✅" label="Done today" value={stats.done_today.length} />
        <Stat icon="🏋️" label="Total sessions" value={stats.total_sessions} />
        <Stat icon="⏱️" label="Minutes trained" value={stats.total_minutes} />
      </div>

      {rec.suggest_checkin && (
        <div className="card row" style={{ justifyContent: 'space-between', marginBottom: 22, borderColor: 'var(--accent)' }}>
          <div>
            <h3 style={{ margin: 0 }}>📝 Start with a quick check-in</h3>
            <span className="muted">30 seconds — it helps me tailor today’s plan to how you feel.</span>
          </div>
          <Link className="btn btn-accent" to="/brainfog/checkin">Check in</Link>
        </div>
      )}

      <h2>Today’s plan</h2>
      <div className="grid cols">
        {rec.plan.map((it) => (
          <Link key={`${it.module}-${it.id}`} to={it.route} className="card ex-card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="ex-icon">{it.icon}</span>
              {it.done_today && <span className="pill done">✓ Done</span>}
            </div>
            <div className="ex-title">{it.title}</div>
            <div className="ex-desc">{it.desc}</div>
            <div className="ex-meta">
              <span className="pill">~{it.est_min} min</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ fontSize: '2rem' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.7rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
        <div className="muted">{label}</div>
      </div>
    </div>
  )
}

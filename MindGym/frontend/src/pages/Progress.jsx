import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { Loading } from '../components/ui.jsx'

const MODULE_LABELS = {
  adhd: '🎯 ADHD', dyslexia: '📖 Dyslexia', brainfog: '🌥️ Brain Fog',
  amnesia: '🧠 Memory', autism: '🧩 Autism',
}

export default function Progress() {
  const [stats, setStats] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [results, setResults] = useState([])

  useEffect(() => {
    api.get('/stats').then(setStats).catch(() => {})
    api.get('/checkins?limit=14').then(setCheckins).catch(() => {})
    api.get('/results?limit=12').then(setResults).catch(() => {})
  }, [])

  if (!stats) return <Loading />

  const maxModule = Math.max(1, ...Object.values(stats.by_module || {}))
  const trend = [...checkins].reverse() // oldest -> newest

  return (
    <div>
      <h1>📈 Your progress</h1>
      <p className="lead">Every session is a rep for your brain. Here’s how it’s adding up.</p>

      <div className="grid cols" style={{ marginBottom: 22 }}>
        <Stat icon="🔥" label="Day streak" value={stats.streak} />
        <Stat icon="📅" label="Active days" value={stats.active_days} />
        <Stat icon="🏋️" label="Total sessions" value={stats.total_sessions} />
        <Stat icon="⏱️" label="Minutes" value={stats.total_minutes} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="card">
          <h2>Sessions by area</h2>
          {Object.keys(stats.by_module || {}).length === 0 ? (
            <p className="muted">No sessions yet — pick an exercise to get started!</p>
          ) : (
            <div className="stack">
              {Object.entries(stats.by_module).map(([m, n]) => (
                <div key={m}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span>{MODULE_LABELS[m] || m}</span>
                    <strong>{n}</strong>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${(n / maxModule) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>How you’ve been feeling</h2>
          {trend.length < 2 ? (
            <p className="muted">Do a couple of daily check-ins and your mood & energy trend will appear here.</p>
          ) : (
            <>
              <Sparkline data={trend.map((c) => c.energy)} color="var(--primary)" label="Energy" />
              <Sparkline data={trend.map((c) => c.mood)} color="var(--accent)" label="Mood" />
              <Sparkline data={trend.map((c) => 6 - c.fog)} color="var(--good)" label="Clarity" />
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Recent sessions</h2>
        {results.length === 0 ? (
          <p className="muted">Nothing logged yet.</p>
        ) : (
          <div className="stack">
            {results.map((r) => (
              <div key={r.id} className="row" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span>{MODULE_LABELS[r.module] || r.module} · <strong>{r.exercise}</strong></span>
                <span className="muted">
                  {r.accuracy ? `${Math.round(r.accuracy * 100)}% · ` : ''}
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
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

// Minimal dependency-free sparkline (values expected 1..5).
function Sparkline({ data, color, label }) {
  const w = 260, h = 46, pad = 4
  const min = 1, max = 5
  const pts = data.map((v, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted">{label}</span>
        <strong>{data[data.length - 1]}/5</strong>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`${label} trend`}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

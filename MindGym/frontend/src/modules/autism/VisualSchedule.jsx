import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { logResult, ProgressBar } from '../../components/ui.jsx'

const ICONS = ['⭐', '☀️', '🍳', '📚', '🏃', '🥗', '🧘', '🌙', '💊', '🛁', '🎮', '💻', '🧹', '🐕', '🚌', '🛒']

// A predictable, picture-based daily plan you can tick off. Predictability
// lowers anxiety, so the layout stays calm and consistent.
export default function VisualSchedule() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('⭐')
  const [time, setTime] = useState('')

  const load = () => api.get('/schedule').then(setItems).catch(() => {})
  useEffect(() => { load() }, [])

  async function add() {
    if (!title.trim()) return
    await api.post('/schedule', { title: title.trim(), icon, time })
    setTitle(''); setTime('')
    load()
  }
  async function toggle(it) {
    await api.put(`/schedule/${it.id}`, { done: !it.done })
    if (!it.done) logResult('autism', 'schedule', { score: 1, accuracy: 1 })
    load()
  }
  async function del(id) { await api.del(`/schedule/${id}`); load() }
  async function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const a = items[i], b = items[j]
    await api.put(`/schedule/${a.id}`, { order: b.order })
    await api.put(`/schedule/${b.id}`, { order: a.order })
    load()
  }
  async function reset() { await api.post('/schedule/reset-day'); load() }

  const done = items.filter((i) => i.done).length

  return (
    <div>
      <Link to="/autism" className="btn btn-sm btn-ghost">← Autism</Link>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ marginTop: 12 }}>🗓️ Visual Schedule</h1>
        <button className="btn btn-sm" onClick={reset}>↺ Reset for a new day</button>
      </div>
      <p className="lead">Your day, one clear step at a time. Tick each as you go.</p>

      {items.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <ProgressBar value={done} max={items.length} />
          <div className="muted" style={{ marginTop: 4 }}>{done} of {items.length} done</div>
        </div>
      )}

      <div className="stack">
        {items.map((it, i) => (
          <div key={it.id} className="card row" style={{
            justifyContent: 'space-between',
            opacity: it.done ? 0.6 : 1,
            borderColor: it.done ? 'var(--good)' : 'var(--border)',
          }}>
            <label className="row" style={{ gap: 14, cursor: 'pointer', flex: 1 }}>
              <input type="checkbox" checked={it.done} onChange={() => toggle(it)} style={{ width: 24, height: 24 }} />
              <span style={{ fontSize: '2rem' }}>{it.icon}</span>
              <span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, textDecoration: it.done ? 'line-through' : 'none' }}>{it.title}</span>
                {it.time && <span className="muted"> · {it.time}</span>}
              </span>
            </label>
            <div className="row">
              <button className="btn btn-sm btn-ghost" aria-label="Move up" onClick={() => move(i, -1)}>↑</button>
              <button className="btn btn-sm btn-ghost" aria-label="Move down" onClick={() => move(i, 1)}>↓</button>
              <button className="btn btn-sm btn-ghost" aria-label="Delete" onClick={() => del(it.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card stack" style={{ marginTop: 18 }}>
        <h3>Add to the schedule</h3>
        <div className="row">
          <select value={icon} onChange={(e) => setIcon(e.target.value)} style={{ fontSize: '1.3rem' }}>
            {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
          </select>
          <input type="text" placeholder="What happens?" value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()} style={{ flex: 1, minWidth: 180 }} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <button className="btn btn-primary" onClick={add}>＋ Add</button>
        </div>
      </div>
    </div>
  )
}

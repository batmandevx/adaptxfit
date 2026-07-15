import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api/client.js'
import { logResult } from '../../components/ui.jsx'

const FIELDS = [
  { key: 'sleep', label: 'Sleep last night', low: 'Poor', high: 'Great', emoji: '😴' },
  { key: 'energy', label: 'Energy', low: 'Drained', high: 'Energised', emoji: '🔋' },
  { key: 'mood', label: 'Mood', low: 'Low', high: 'Good', emoji: '🙂' },
  { key: 'focus', label: 'Focus', low: 'Scattered', high: 'Sharp', emoji: '🎯' },
  { key: 'fog', label: 'Brain fog', low: 'Clear', high: 'Foggy', emoji: '🌫️' },
]

export default function CheckIn() {
  const nav = useNavigate()
  const [vals, setVals] = useState({ sleep: 3, energy: 3, mood: 3, focus: 3, fog: 3 })
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }))

  async function submit() {
    await api.post('/checkins', { ...vals, note })
    logResult('brainfog', 'checkin', { score: vals.energy + vals.mood + vals.focus, accuracy: 1 })
    setSaved(true)
  }

  const rough = vals.energy <= 2 || vals.mood <= 2 || vals.focus <= 2 || vals.fog >= 4
  const tip = rough
    ? 'Today looks like a gentle day. Try Box Breathing or a short Reading Assist — and be kind to yourself. 💚'
    : 'Nice baseline! A Clarity Puzzle or a Focus session could be a great next step. ✨'

  return (
    <div>
      <Link to="/brainfog" className="btn btn-sm btn-ghost">← Brain Fog</Link>
      <h1 style={{ marginTop: 12 }}>📝 Daily Check-In</h1>
      <p className="lead">A quick read on how you are right now. This shapes the rest of today’s plan.</p>

      {!saved ? (
        <div className="card stack pad-lg">
          {FIELDS.map((f) => (
            <div key={f.key} className="slider-row">
              <span>{f.emoji} {f.label}</span>
              <div>
                <input type="range" min="1" max="5" step="1" value={vals[f.key]} style={{ width: '100%' }}
                  onChange={(e) => set(f.key, +e.target.value)} aria-label={f.label} />
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="muted" style={{ fontSize: '.78rem' }}>{f.low}</span>
                  <span className="muted" style={{ fontSize: '.78rem' }}>{f.high}</span>
                </div>
              </div>
              <span className="val">{vals[f.key]}</span>
            </div>
          ))}

          <div>
            <label className="muted">Anything on your mind? (optional)</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="A word or two about today…" />
          </div>

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-lg" onClick={submit}>Save check-in</button>
          </div>
        </div>
      ) : (
        <div className="card center pad-lg">
          <div style={{ fontSize: '3rem' }}>✅</div>
          <h2>Check-in saved</h2>
          <p className="lead" style={{ maxWidth: '46ch', margin: '0 auto 18px' }}>{tip}</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => nav('/')}>Go to my plan</button>
            <Link className="btn" to="/progress">See my trends</Link>
          </div>
        </div>
      )}
    </div>
  )
}

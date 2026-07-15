import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'
import { useA11y } from '../context/AccessibilityContext.jsx'

const CONDITIONS = [
  { id: 'adhd', icon: '🎯', title: 'ADHD', desc: 'Focus, attention & follow-through' },
  { id: 'dyslexia', icon: '📖', title: 'Dyslexia', desc: 'Reading & spelling support' },
  { id: 'brainfog', icon: '🌥️', title: 'Brain Fog', desc: 'Low clarity or energy' },
  { id: 'amnesia', icon: '🧠', title: 'Memory / Amnesia', desc: 'Remembering day-to-day things' },
  { id: 'autism', icon: '🧩', title: 'Autism', desc: 'Routine & social support' },
]

export default function Onboarding() {
  const { profile, update } = useProfile()
  const { settings, set } = useA11y()
  const nav = useNavigate()
  const [name, setName] = useState(profile?.name && profile.name !== 'Friend' ? profile.name : '')
  const [picked, setPicked] = useState(new Set(profile?.conditions || []))
  const [saving, setSaving] = useState(false)

  const toggle = (id) => {
    setPicked((p) => {
      const n = new Set(p)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const finish = async () => {
    setSaving(true)
    try {
      await update({
        name: name.trim() || 'Friend',
        conditions: [...picked],
        onboarded: true,
      })
      nav('/')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1>Welcome to MindGym 🧠</h1>
      <p className="lead">
        A gentle gym for your mind. Tell us a little about you and we’ll build a daily
        plan that fits. You can change all of this any time — nothing here is fixed.
      </p>

      <div className="card stack">
        <div>
          <h3>What should we call you?</h3>
          <input
            type="text"
            value={name}
            placeholder="Your name (optional)"
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', maxWidth: 320 }}
          />
        </div>
      </div>

      <h2 style={{ marginTop: 26 }}>Which areas would you like to train?</h2>
      <p className="muted">Pick any that apply. We’ll prioritise these — but everything stays available.</p>
      <div className="grid cols">
        {CONDITIONS.map((c) => {
          const on = picked.has(c.id)
          return (
            <button
              key={c.id}
              type="button"
              className="card ex-card"
              aria-pressed={on}
              onClick={() => toggle(c.id)}
              style={{
                textAlign: 'left',
                borderColor: on ? 'var(--primary)' : 'var(--border)',
                borderWidth: 2,
                background: on ? 'var(--surface-2)' : 'var(--surface)',
              }}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="ex-icon">{c.icon}</span>
                <span className="pill" style={on ? { background: 'var(--primary)', color: 'var(--primary-text)', borderColor: 'transparent' } : {}}>
                  {on ? '✓ Selected' : 'Tap to add'}
                </span>
              </div>
              <div className="ex-title">{c.title}</div>
              <div className="ex-desc">{c.desc}</div>
            </button>
          )
        })}
      </div>

      <div className="card stack" style={{ marginTop: 22 }}>
        <h3>Comfort settings</h3>
        <p className="muted" style={{ marginTop: -6 }}>
          Set how MindGym looks and feels. You can also change these any time from the top bar.
        </p>
        <div className="row">
          <span className="muted">Theme:</span>
          {['calm', 'light', 'dark', 'contrast'].map((t) => (
            <button key={t} className={`btn btn-sm ${settings.theme === t ? 'btn-primary' : ''}`} onClick={() => set({ theme: t })}>
              {t === 'contrast' ? 'High contrast' : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="row">
          <span className="muted">Font:</span>
          <button className={`btn btn-sm ${settings.font === 'system' ? 'btn-primary' : ''}`} onClick={() => set({ font: 'system' })}>Default</button>
          <button className={`btn btn-sm ${settings.font === 'dyslexic' ? 'btn-primary' : ''}`} onClick={() => set({ font: 'dyslexic' })}>Dyslexia-friendly</button>
        </div>
      </div>

      <div className="row" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-lg" onClick={finish} disabled={saving}>
          {saving ? 'Saving…' : 'Start training →'}
        </button>
      </div>
    </div>
  )
}

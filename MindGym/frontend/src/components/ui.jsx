import { useCallback, useState } from 'react'
import { useA11y } from '../context/AccessibilityContext.jsx'
import { api } from '../api/client.js'

// Fire-and-forget logging of an exercise result to the backend.
export async function logResult(module, exercise, data = {}) {
  try {
    return await api.post('/results', { module, exercise, ...data })
  } catch (e) {
    console.error('Could not log result', e)
    return null
  }
}

// Lightweight toast: returns [node, show].
export function useToast() {
  const [msg, setMsg] = useState(null)
  const show = useCallback((m) => {
    setMsg(m)
    clearTimeout(window.__mg_toast)
    window.__mg_toast = setTimeout(() => setMsg(null), 1900)
  }, [])
  const node = msg ? <div className="toast pop">{msg}</div> : null
  return [node, show]
}

// A button that reads text aloud (respects the global TTS toggle).
export function SpeakButton({ text, label = 'Read aloud', className = '' }) {
  const { speak, settings } = useA11y()
  if (!settings.tts) return null
  return (
    <button
      type="button"
      className={`btn btn-sm ${className}`}
      onClick={() => speak(text)}
      aria-label={label}
      title={label}
    >
      🔊 {label}
    </button>
  )
}

export function ProgressBar({ value, max = 100 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Loading({ label = 'Loading…' }) {
  return <div className="card center muted">{label}</div>
}

export function PageHeader({ icon, title, subtitle, children }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
      <div>
        <h1>{icon ? `${icon} ` : ''}{title}</h1>
        {subtitle && <p className="lead" style={{ margin: 0 }}>{subtitle}</p>}
      </div>
      <div className="row">{children}</div>
    </div>
  )
}

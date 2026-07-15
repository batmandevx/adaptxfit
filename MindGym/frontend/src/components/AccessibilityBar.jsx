import { useA11y } from '../context/AccessibilityContext.jsx'

const THEMES = [
  { id: 'calm', label: 'Calm' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'contrast', label: 'High contrast' },
]
const FONTS = [
  { id: 'system', label: 'Default' },
  { id: 'dyslexic', label: 'Dyslexia-friendly' },
  { id: 'serif', label: 'Serif' },
]

// Always-visible accessibility controls. Changing anything here updates the
// whole app instantly via AccessibilityContext.
export default function AccessibilityBar() {
  const { settings, set, stopSpeak } = useA11y()

  return (
    <div className="a11y-bar" role="region" aria-label="Accessibility settings">
      <div className="seg">
        <label htmlFor="theme">🎨 Theme</label>
        <select id="theme" value={settings.theme} onChange={(e) => set({ theme: e.target.value })}>
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="seg">
        <label htmlFor="font">🔡 Font</label>
        <select id="font" value={settings.font} onChange={(e) => set({ font: e.target.value })}>
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="seg">
        <label>🔍 Text size</label>
        <button className="btn btn-sm icon-btn" aria-label="Smaller text"
          onClick={() => set({ fontScale: Math.max(0.85, +(settings.fontScale - 0.1).toFixed(2)) })}>A-</button>
        <span className="muted" style={{ minWidth: 38, textAlign: 'center' }}>
          {Math.round(settings.fontScale * 100)}%
        </span>
        <button className="btn btn-sm icon-btn" aria-label="Larger text"
          onClick={() => set({ fontScale: Math.min(1.6, +(settings.fontScale + 0.1).toFixed(2)) })}>A+</button>
      </div>

      <div className="spacer" />

      <button
        className={`btn btn-sm ${settings.reducedMotion ? 'btn-primary' : ''}`}
        aria-pressed={settings.reducedMotion}
        onClick={() => set({ reducedMotion: !settings.reducedMotion })}
      >
        🌙 Reduce motion {settings.reducedMotion ? 'on' : 'off'}
      </button>

      <button
        className={`btn btn-sm ${settings.tts ? 'btn-primary' : ''}`}
        aria-pressed={settings.tts}
        onClick={() => { if (settings.tts) stopSpeak(); set({ tts: !settings.tts }) }}
      >
        🔊 Read aloud {settings.tts ? 'on' : 'off'}
      </button>
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { logResult } from '../../components/ui.jsx'
import { useA11y } from '../../context/AccessibilityContext.jsx'

// Read along with synchronised text-to-speech + word highlighting, in a
// dyslexia-friendly layout. Works on built-in passages or your own text.
export default function ReadingAssist() {
  const { settings, set } = useA11y()
  const [passages, setPassages] = useState([])
  const [idx, setIdx] = useState(0)
  const [custom, setCustom] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [rate, setRate] = useState(0.9)
  const [active, setActive] = useState(-1)
  const [playing, setPlaying] = useState(false)

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => { api.get('/content/passages').then(setPassages).catch(() => {}) }, [])
  useEffect(() => () => { try { window.speechSynthesis.cancel() } catch { /* */ } }, [])

  const text = useCustom ? custom : (passages[idx]?.text || '')

  const words = useMemo(() => {
    const arr = []
    const re = /\S+/g
    let m
    while ((m = re.exec(text))) arr.push({ w: m[0], start: m.index, end: m.index + m[0].length })
    return arr
  }, [text])

  function stop() {
    try { window.speechSynthesis.cancel() } catch { /* */ }
    setPlaying(false)
    setActive(-1)
  }

  function play() {
    if (!supported || !text.trim()) return
    stop()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = rate
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return
      const ci = e.charIndex
      const i = words.findIndex((wd) => ci >= wd.start && ci < wd.end)
      if (i >= 0) setActive(i)
    }
    u.onend = () => {
      setPlaying(false)
      setActive(-1)
      logResult('dyslexia', 'reading', { duration_sec: Math.round(text.length / 12), accuracy: 1 })
    }
    window.speechSynthesis.speak(u)
    setPlaying(true)
  }

  return (
    <div>
      <Link to="/dyslexia" className="btn btn-sm btn-ghost">← Dyslexia</Link>
      <h1 style={{ marginTop: 12 }}>📖 Reading Assist</h1>
      <p className="lead">
        Listen and follow the highlighted words. Try the dyslexia-friendly font and bigger text
        if that feels easier.
      </p>

      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div className="row">
          <label className="muted">Passage</label>
          <select value={useCustom ? 'custom' : idx} onChange={(e) => {
            if (e.target.value === 'custom') setUseCustom(true)
            else { setUseCustom(false); setIdx(+e.target.value) }
            stop()
          }}>
            {passages.map((p, i) => <option key={i} value={i}>{p.title}</option>)}
            <option value="custom">✏️ My own text…</option>
          </select>
        </div>
        <div className="row">
          {settings.font !== 'dyslexic' && (
            <button className="btn btn-sm" onClick={() => set({ font: 'dyslexic' })}>Use dyslexia font</button>
          )}
          <button className="btn btn-sm" onClick={() => set({ fontScale: Math.min(1.6, +(settings.fontScale + 0.1).toFixed(2)) })}>Bigger text</button>
        </div>
      </div>

      {useCustom && (
        <textarea
          className="card" rows={4} value={custom} placeholder="Paste or type anything you’d like read aloud…"
          onChange={(e) => { setCustom(e.target.value); stop() }}
          style={{ marginTop: 14, fontSize: '1.05rem' }}
        />
      )}

      <div className="card pad-lg" style={{ marginTop: 14 }}>
        <p style={{ fontSize: '1.4rem', lineHeight: 2, maxWidth: '60ch' }}>
          {words.length === 0 ? <span className="muted">Type or choose a passage to begin.</span> :
            words.map((wd, i) => (
              <span key={i} style={{
                background: i === active ? 'var(--accent)' : 'transparent',
                color: i === active ? '#1b130a' : 'inherit',
                borderRadius: 6, padding: '0 2px', transition: 'background .12s',
              }}>{wd.w}{' '}</span>
            ))}
        </p>
      </div>

      <div className="card row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
        <div className="row">
          {!playing
            ? <button className="btn btn-primary btn-lg" disabled={!supported || !text.trim()} onClick={play}>▶ Read aloud</button>
            : <button className="btn btn-lg" onClick={stop}>⏹ Stop</button>}
        </div>
        <div className="row">
          <label className="muted">Speed</label>
          <input type="range" min="0.5" max="1.2" step="0.05" value={rate}
            onChange={(e) => setRate(+e.target.value)} />
          <span className="muted">{rate.toFixed(2)}×</span>
        </div>
      </div>
      {!supported && <p className="muted">Your browser doesn’t support read-aloud. Try Edge or Chrome.</p>}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { logResult, useToast } from '../../components/ui.jsx'
import { useA11y } from '../../context/AccessibilityContext.jsx'

const ENCOURAGE = [
  'You’re not alone — I’m focusing right here with you. 🤝',
  'Just this one thing, for now. That’s enough.',
  'Wandering mind? Gently come back. That’s the rep. 💪',
  'Steady. One small step at a time.',
  'You’re doing it. Keep going.',
]

export default function FocusTimer() {
  const { speak } = useA11y()
  const [toast, showToast] = useToast()
  const [focusMin, setFocusMin] = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [phase, setPhase] = useState('focus') // focus | break
  const [secs, setSecs] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [tipIdx, setTipIdx] = useState(0)
  const startRef = useRef(null)
  const tickRef = useRef(null)

  const total = (phase === 'focus' ? focusMin : breakMin) * 60
  const progress = 1 - secs / total

  // keep timer in sync when not running and durations change
  useEffect(() => {
    if (!running) setSecs((phase === 'focus' ? focusMin : breakMin) * 60)
  }, [focusMin, breakMin, phase, running])

  useEffect(() => {
    if (!running) return
    tickRef.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current)
          handleComplete()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(tickRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase])

  useEffect(() => {
    const id = setInterval(() => setTipIdx((i) => (i + 1) % ENCOURAGE.length), 12000)
    return () => clearInterval(id)
  }, [])

  function start() {
    if (!running) startRef.current = Date.now()
    setRunning(true)
  }
  function pause() { setRunning(false) }
  function reset() {
    setRunning(false)
    setSecs((phase === 'focus' ? focusMin : breakMin) * 60)
  }

  function handleComplete() {
    setRunning(false)
    if (phase === 'focus') {
      logResult('adhd', 'focus', { duration_sec: focusMin * 60, score: focusMin, accuracy: 1 })
      showToast('🎉 Focus session complete! Take a break.')
      speak('Great focus. Time for a short break.')
      setPhase('break')
      setSecs(breakMin * 60)
    } else {
      showToast('Break over — ready for another round?')
      speak('Break finished. Ready when you are.')
      setPhase('focus')
      setSecs(focusMin * 60)
    }
  }

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const R = 92, C = 2 * Math.PI * R

  return (
    <div>
      <Link to="/adhd" className="btn btn-sm btn-ghost">← ADHD</Link>
      <h1 style={{ marginTop: 12 }}>⏱️ Focus Timer</h1>
      <p className="lead">
        Work in calm, focused bursts. I’ll sit with you the whole time — that’s “body doubling”,
        and it really helps.
      </p>

      <div className="card center pad-lg">
        <div className="pill" style={{ marginBottom: 14 }}>
          {phase === 'focus' ? '🎯 Focus time' : '🌿 Break time'}
        </div>

        <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
          <svg width="220" height="220">
            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
            <circle
              cx="110" cy="110" r={R} fill="none"
              stroke={phase === 'focus' ? 'var(--primary)' : 'var(--good)'}
              strokeWidth="14" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
              transform="rotate(-90 110 110)"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {mm}:{ss}
            </div>
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'center', marginTop: 18 }}>
          {!running ? (
            <button className="btn btn-primary btn-lg" onClick={start}>▶ Start</button>
          ) : (
            <button className="btn btn-lg" onClick={pause}>⏸ Pause</button>
          )}
          <button className="btn btn-lg" onClick={reset}>↺ Reset</button>
        </div>

        <p className="muted" style={{ marginTop: 18, minHeight: '1.5em' }}>{ENCOURAGE[tipIdx]}</p>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>Adjust your rhythm</h3>
        <div className="row">
          <label>Focus minutes</label>
          <select value={focusMin} disabled={running} onChange={(e) => setFocusMin(+e.target.value)}>
            {[10, 15, 20, 25, 30, 45, 50].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <label>Break minutes</label>
          <select value={breakMin} disabled={running} onChange={(e) => setBreakMin(+e.target.value)}>
            {[3, 5, 10, 15].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      {toast}
    </div>
  )
}

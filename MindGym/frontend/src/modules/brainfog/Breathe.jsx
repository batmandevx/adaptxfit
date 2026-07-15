import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { logResult } from '../../components/ui.jsx'
import { useA11y } from '../../context/AccessibilityContext.jsx'

const PHASES = [
  { label: 'Breathe in', dur: 4, scale: 1.5 },
  { label: 'Hold', dur: 4, scale: 1.5 },
  { label: 'Breathe out', dur: 4, scale: 0.75 },
  { label: 'Hold', dur: 4, scale: 0.75 },
]

// Box breathing (4-4-4-4): a simple, evidence-friendly way to clear fog & calm down.
export default function Breathe() {
  const { settings, speak } = useA11y()
  const [running, setRunning] = useState(false)
  const [pi, setPi] = useState(0)
  const [left, setLeft] = useState(4)
  const [cycles, setCycles] = useState(0)
  const leftRef = useRef(4)

  useEffect(() => {
    if (!running) return
    leftRef.current = PHASES[pi].dur
    setLeft(leftRef.current)
    if (settings.tts) speak(PHASES[pi].label)
    const id = setInterval(() => {
      leftRef.current -= 1
      if (leftRef.current <= 0) {
        const np = (pi + 1) % PHASES.length
        if (np === 0) setCycles((c) => c + 1)
        setPi(np)
      } else {
        setLeft(leftRef.current)
      }
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, pi])

  function start() {
    setCycles(0); setPi(0); leftRef.current = PHASES[0].dur; setLeft(PHASES[0].dur)
    setRunning(true)
  }
  function stop() {
    setRunning(false)
    if (cycles > 0) logResult('brainfog', 'breathe', { duration_sec: cycles * 16, score: cycles, accuracy: 1 })
  }

  const phase = PHASES[pi]
  const reduced = settings.reducedMotion

  return (
    <div>
      <Link to="/brainfog" className="btn btn-sm btn-ghost">← Brain Fog</Link>
      <h1 style={{ marginTop: 12 }}>🧘 Box Breathing</h1>
      <p className="lead">In for 4, hold for 4, out for 4, hold for 4. Follow the circle and let it slow you down.</p>

      <div className="card center pad-lg">
        <div style={{ height: 280, display: 'grid', placeItems: 'center' }}>
          <div
            style={{
              width: 150, height: 150, borderRadius: '50%',
              background: 'radial-gradient(circle at 50% 40%, var(--primary), var(--accent))',
              display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800,
              transform: `scale(${running && !reduced ? phase.scale : 1})`,
              transition: reduced ? 'none' : `transform ${phase.dur}s ease-in-out`,
              boxShadow: 'var(--shadow)',
            }}
          >
            <div className="center">
              <div style={{ fontSize: '1.1rem' }}>{running ? phase.label : 'Ready?'}</div>
              {running && <div style={{ fontSize: '2.2rem' }}>{left}</div>}
            </div>
          </div>
        </div>

        <div className="muted">Completed cycles: {cycles}</div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
          {!running
            ? <button className="btn btn-primary btn-lg" onClick={start}>▶ Begin</button>
            : <button className="btn btn-lg" onClick={stop}>⏹ Finish</button>}
        </div>
      </div>
    </div>
  )
}

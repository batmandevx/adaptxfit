import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { logResult } from '../../components/ui.jsx'

const TOTAL = 20
const STIM_MS = 850

// Go / No-Go: press for GO (green circle), hold back for NO-GO (red square).
// Trains sustained attention and impulse control.
export default function GoNoGo() {
  const [phase, setPhase] = useState('idle') // idle | running | done
  const [stim, setStim] = useState(null) // 'go' | 'nogo' | null
  const [trialDisplay, setTrialDisplay] = useState(0)
  const [result, setResult] = useState(null)

  const stats = useRef(fresh())
  const trialRef = useRef(0)
  const responded = useRef(false)
  const shownAt = useRef(0)
  const stimTimer = useRef(null)
  const gapTimer = useRef(null)

  function fresh() { return { hits: 0, misses: 0, cr: 0, fa: 0, rts: [] } }

  useEffect(() => () => { clearTimeout(stimTimer.current); clearTimeout(gapTimer.current) }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); respond() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })

  function begin() {
    stats.current = fresh()
    trialRef.current = 0
    setTrialDisplay(0)
    setResult(null)
    setPhase('running')
    gap()
  }

  function gap() {
    setStim(null)
    gapTimer.current = setTimeout(show, 550 + Math.random() * 500)
  }

  function show() {
    const type = Math.random() < 0.7 ? 'go' : 'nogo'
    responded.current = false
    shownAt.current = performance.now()
    setStim(type)
    stimTimer.current = setTimeout(() => endStim(type, false), STIM_MS)
  }

  function endStim(type, wasResponse) {
    clearTimeout(stimTimer.current)
    if (!wasResponse) {
      if (type === 'go') stats.current.misses++
      else stats.current.cr++
    }
    setStim(null)
    trialRef.current += 1
    setTrialDisplay(trialRef.current)
    if (trialRef.current >= TOTAL) finish()
    else gap()
  }

  function respond() {
    if (phase !== 'running' || !stim || responded.current) return
    responded.current = true
    const rt = performance.now() - shownAt.current
    if (stim === 'go') { stats.current.hits++; stats.current.rts.push(rt) }
    else stats.current.fa++
    endStim(stim, true)
  }

  function finish() {
    setPhase('done')
    setStim(null)
    const s = stats.current
    const correct = s.hits + s.cr
    const acc = correct / TOTAL
    const avgRt = s.rts.length ? Math.round(s.rts.reduce((a, b) => a + b, 0) / s.rts.length) : 0
    setResult({ ...s, acc, avgRt })
    logResult('adhd', 'gonogo', {
      accuracy: acc, score: Math.round(acc * 100),
      details: { avgRt, hits: s.hits, misses: s.misses, cr: s.cr, fa: s.fa },
    })
  }

  return (
    <div>
      <Link to="/adhd" className="btn btn-sm btn-ghost">← ADHD</Link>
      <h1 style={{ marginTop: 12 }}>🟢 Attention Game (Go / No-Go)</h1>
      <p className="lead">
        Tap the button (or press <strong>Space</strong>) when you see the green <strong>GO</strong> circle.
        Do nothing for the red <strong>STOP</strong> square. Stay sharp!
      </p>

      <div
        className="card center pad-lg"
        style={{ userSelect: 'none' }}
      >
        {phase === 'idle' && (
          <>
            <p className="muted">{TOTAL} quick rounds. Ready?</p>
            <button className="btn btn-primary btn-lg" onClick={begin}>Start</button>
          </>
        )}

        {phase === 'running' && (
          <>
            <div className="muted" style={{ marginBottom: 10 }}>Round {trialDisplay + 1} / {TOTAL}</div>
            <button
              onClick={respond}
              aria-label="Respond"
              style={{
                width: 230, height: 230, border: 'none', cursor: 'pointer',
                background: 'transparent', display: 'grid', placeItems: 'center',
              }}
            >
              <Stimulus type={stim} />
            </button>
            <p className="muted">Press Space or tap the shape when it’s green.</p>
          </>
        )}

        {phase === 'done' && result && (
          <>
            <div style={{ fontSize: '3rem' }}>{result.acc >= 0.8 ? '🌟' : result.acc >= 0.6 ? '👍' : '💪'}</div>
            <h2>{Math.round(result.acc * 100)}% accuracy</h2>
            <p className="muted">Average reaction time: <strong>{result.avgRt || '—'} ms</strong></p>
            <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="pill good">✓ {result.hits} go hits</span>
              <span className="pill good">✓ {result.cr} correct stops</span>
              <span className="pill">↩ {result.misses} missed</span>
              <span className="pill">✋ {result.fa} impulse slips</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn btn-primary btn-lg" onClick={begin}>Play again</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Stimulus({ type }) {
  if (type === 'go') {
    return (
      <div className="pop" style={{
        width: 180, height: 180, borderRadius: '50%', background: 'var(--good)',
        display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: '2rem',
      }}>GO</div>
    )
  }
  if (type === 'nogo') {
    return (
      <div className="pop" style={{
        width: 170, height: 170, borderRadius: 18, background: 'var(--danger)',
        display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: '2rem',
      }}>STOP</div>
    )
  }
  return <div style={{ fontSize: '2.4rem', color: 'var(--text-muted)' }}>＋</div>
}

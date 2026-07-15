import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logResult } from '../../components/ui.jsx'
import { useA11y } from '../../context/AccessibilityContext.jsx'

const AFFIRMATIONS = [
  'You are safe right now.',
  'There is nothing you must fix this moment.',
  'Your feelings are allowed.',
  'Slow breath in… and slow breath out…',
  'You are doing enough.',
  'This moment will pass, gently.',
]

// A low-stimulation space to self-regulate. Soft colours, slow motion, quiet text.
export default function CalmSpace() {
  const { settings } = useA11y()
  const nav = useNavigate()
  const [i, setI] = useState(0)
  const [dim, setDim] = useState(false)
  const startRef = useRef(Date.now())
  const reduced = settings.reducedMotion

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % AFFIRMATIONS.length), 9000)
    return () => clearInterval(id)
  }, [])

  function done() {
    const secs = Math.round((Date.now() - startRef.current) / 1000)
    if (secs > 5) logResult('autism', 'calm', { duration_sec: secs, score: 1, accuracy: 1 })
    nav('/autism')
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Link to="/autism" className="btn btn-sm btn-ghost">← Autism</Link>
        <button className="btn btn-sm" onClick={() => setDim((d) => !d)}>{dim ? '☀️ Brighten' : '🌑 Dim'}</button>
      </div>

      <div
        className="card center"
        style={{
          marginTop: 14, minHeight: '64vh', display: 'grid', placeItems: 'center',
          background: dim
            ? 'linear-gradient(160deg, #0c1116, #141b22)'
            : 'linear-gradient(160deg, var(--surface), var(--surface-2))',
          border: 'none', position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', width: 360, height: 360, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(122,184,255,.35), transparent 70%)',
            filter: 'blur(8px)',
            animation: reduced ? 'none' : 'calmpulse 11s ease-in-out infinite',
          }}
        />
        <div style={{ position: 'relative', maxWidth: '24ch', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 18 }}>🌊</div>
          <p style={{
            fontSize: '1.6rem', lineHeight: 1.7,
            color: dim ? '#cfe0f5' : 'var(--text)', transition: 'opacity 1s',
          }}>
            {AFFIRMATIONS[i]}
          </p>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
        <button className="btn btn-primary btn-lg" onClick={done}>I feel calmer</button>
      </div>

      <style>{`
        @keyframes calmpulse {
          0%, 100% { transform: scale(0.85); opacity: 0.55; }
          50% { transform: scale(1.15); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}

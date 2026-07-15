import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { logResult } from '../../components/ui.jsx'

// Recognise a feeling from a face. Builds emotional literacy at a calm pace.
export default function EmotionMatch() {
  const [rounds, setRounds] = useState([])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const correctRef = useRef(0)

  function load() {
    api.get('/content/emotions?n=6').then((r) => {
      setRounds(r); setI(0); setScore(0); setPicked(null); setDone(false)
      correctRef.current = 0
    }).catch(() => {})
  }
  useEffect(load, [])

  const cur = rounds[i]

  function pick(opt) {
    if (picked) return
    setPicked(opt)
    if (opt === cur.answer) { setScore((s) => s + 1); correctRef.current += 1 }
  }
  function next() {
    if (i + 1 >= rounds.length) {
      setDone(true)
      logResult('autism', 'emotions', { accuracy: correctRef.current / (rounds.length || 1), score: correctRef.current })
    } else {
      setI(i + 1); setPicked(null)
    }
  }

  if (!cur && !done) return <div className="content muted">Loading…</div>

  return (
    <div>
      <Link to="/autism" className="btn btn-sm btn-ghost">← Autism</Link>
      <h1 style={{ marginTop: 12 }}>🙂 Emotion Match</h1>
      <p className="lead">Look at the face. Which feeling do you think it shows?</p>

      {!done ? (
        <div className="card center pad-lg">
          <div className="muted">Face {i + 1} / {rounds.length} · Score {score}</div>
          <div style={{ fontSize: '7rem', margin: '8px 0' }}>{cur.emoji}</div>
          <div className="choices" style={{ maxWidth: 520, margin: '0 auto' }}>
            {cur.options.map((opt) => {
              let cls = 'choice'
              if (picked) {
                if (opt === cur.answer) cls += ' correct'
                else if (opt === picked) cls += ' wrong'
              }
              return <button key={opt} className={cls} disabled={!!picked} onClick={() => pick(opt)}>{opt}</button>
            })}
          </div>
          {picked && (
            <div style={{ marginTop: 16 }}>
              <p className="muted">{picked === cur.answer ? '✅ Yes, that’s it!' : `This face usually means “${cur.answer}”.`}</p>
              <button className="btn btn-primary btn-lg" onClick={next}>{i + 1 >= rounds.length ? 'See results' : 'Next →'}</button>
            </div>
          )}
        </div>
      ) : (
        <div className="card center pad-lg">
          <div style={{ fontSize: '3rem' }}>{score >= rounds.length * 0.75 ? '🌟' : '👍'}</div>
          <h2>{score} / {rounds.length} correct</h2>
          <button className="btn btn-primary btn-lg" onClick={load}>Play again</button>
        </div>
      )}
    </div>
  )
}

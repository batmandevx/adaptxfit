import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { logResult } from '../../components/ui.jsx'

const LETTERS = ['b', 'd', 'p', 'q']
const ROUNDS = 12

// Letters b d p q are the classic dyslexia mix-ups. See the letter, name it.
export default function LetterFlip() {
  const [round, setRound] = useState(0)
  const [target, setTarget] = useState('b')
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const correctRef = useRef(0)
  const timer = useRef(null)

  function newTarget() {
    setTarget(LETTERS[Math.floor(Math.random() * LETTERS.length)])
    setPicked(null)
  }

  function begin() {
    setRound(0); setScore(0); setDone(false); correctRef.current = 0
    newTarget()
  }
  useEffect(() => { begin(); return () => clearTimeout(timer.current) }, [])

  function choose(letter) {
    if (picked) return
    setPicked(letter)
    const ok = letter === target
    if (ok) { setScore((s) => s + 1); correctRef.current += 1 }
    timer.current = setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        setDone(true)
        const acc = correctRef.current / ROUNDS
        logResult('dyslexia', 'letters', { accuracy: acc, score: Math.round(acc * 100) })
      } else {
        setRound((r) => r + 1)
        newTarget()
      }
    }, 750)
  }

  return (
    <div>
      <Link to="/dyslexia" className="btn btn-sm btn-ghost">← Dyslexia</Link>
      <h1 style={{ marginTop: 12 }}>🔀 Letter Flip</h1>
      <p className="lead">Which letter is this? Take your time and look closely at which way it faces.</p>

      {!done ? (
        <div className="card center pad-lg">
          <div className="muted">Round {round + 1} / {ROUNDS} · Score {score}</div>
          <div style={{
            fontSize: '9rem', fontWeight: 800, lineHeight: 1, margin: '10px 0 20px',
            fontFamily: "'OpenDyslexic','Comic Sans MS', system-ui, sans-serif",
          }}>{target}</div>

          <div className="choices" style={{ maxWidth: 460, margin: '0 auto' }}>
            {LETTERS.map((l) => {
              let cls = 'choice'
              if (picked) {
                if (l === target) cls += ' correct'
                else if (l === picked) cls += ' wrong'
              }
              return (
                <button key={l} className={cls} style={{ fontSize: '2rem' }} disabled={!!picked} onClick={() => choose(l)}>
                  {l}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="card center pad-lg">
          <div style={{ fontSize: '3rem' }}>{score >= ROUNDS * 0.8 ? '🌟' : '👍'}</div>
          <h2>{score} / {ROUNDS} correct</h2>
          <button className="btn btn-primary btn-lg" onClick={begin}>Play again</button>
        </div>
      )}
    </div>
  )
}

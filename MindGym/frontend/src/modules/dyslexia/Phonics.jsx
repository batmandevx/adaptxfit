import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { logResult } from '../../components/ui.jsx'

// Hear a word, choose the correct spelling from look-alikes.
export default function Phonics() {
  const [rounds, setRounds] = useState([])
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState(null)
  const [done, setDone] = useState(false)
  const correctRef = useRef(0)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  function load() {
    api.get('/content/phonics?n=8').then((r) => {
      setRounds(r); setI(0); setScore(0); setPicked(null); setDone(false)
      correctRef.current = 0
    }).catch(() => {})
  }
  useEffect(load, [])

  const cur = rounds[i]

  function hear(word) {
    if (!supported || !word) return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(word)
      u.rate = 0.8
      window.speechSynthesis.speak(u)
    } catch { /* */ }
  }
  useEffect(() => { if (cur) hear(cur.word) }, [i, rounds]) // eslint-disable-line

  function choose(opt) {
    if (picked) return
    setPicked(opt)
    if (opt === cur.word) { setScore((s) => s + 1); correctRef.current += 1 }
  }

  function next() {
    if (i + 1 >= rounds.length) {
      setDone(true)
      const acc = correctRef.current / (rounds.length || 1)
      logResult('dyslexia', 'phonics', { accuracy: acc, score: Math.round(acc * 100) })
    } else {
      setI(i + 1); setPicked(null)
    }
  }

  if (!cur && !done) return <div className="content muted">Loading…</div>

  return (
    <div>
      <Link to="/dyslexia" className="btn btn-sm btn-ghost">← Dyslexia</Link>
      <h1 style={{ marginTop: 12 }}>🔤 Phonics Game</h1>
      <p className="lead">Listen to the word, then tap the spelling that’s correct.</p>

      {!done ? (
        <div className="card center pad-lg">
          <div className="muted">Word {i + 1} / {rounds.length} · Score {score}</div>
          <button className="btn btn-primary btn-lg" style={{ margin: '16px 0' }} onClick={() => hear(cur.word)}>
            🔊 Play the word
          </button>
          {!supported && <p className="muted">Audio unavailable — the word is “<strong>{cur.word}</strong>”.</p>}

          <div className="choices" style={{ marginTop: 8 }}>
            {cur.options.map((opt) => {
              let cls = 'choice'
              if (picked) {
                if (opt === cur.word) cls += ' correct'
                else if (opt === picked) cls += ' wrong'
              }
              return (
                <button key={opt} className={cls} onClick={() => choose(opt)} disabled={!!picked}>
                  {opt}
                </button>
              )
            })}
          </div>

          {picked && (
            <div style={{ marginTop: 18 }}>
              <p className="muted">{picked === cur.word ? '✅ Correct!' : `It’s spelled “${cur.word}”.`}</p>
              <button className="btn btn-primary btn-lg" onClick={next}>
                {i + 1 >= rounds.length ? 'See results' : 'Next word →'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card center pad-lg">
          <div style={{ fontSize: '3rem' }}>{score >= rounds.length * 0.8 ? '🌟' : '👍'}</div>
          <h2>{score} / {rounds.length} correct</h2>
          <button className="btn btn-primary btn-lg" onClick={load}>Play again</button>
        </div>
      )}
    </div>
  )
}

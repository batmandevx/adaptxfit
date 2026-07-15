import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { logResult } from '../../components/ui.jsx'

const PER_SESSION = 5

// A short string of light puzzles to gently switch the brain on.
export default function ClarityPuzzle() {
  const [puzzle, setPuzzle] = useState(null)
  const [n, setN] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState(null)
  const [done, setDone] = useState(false)
  const [difficulty, setDifficulty] = useState(1)
  const correctRef = useRef(0)

  function fetchPuzzle(d) {
    api.get(`/content/puzzle?difficulty=${d}`).then((p) => { setPuzzle(p); setPicked(null) }).catch(() => {})
  }
  function begin() {
    setN(0); setScore(0); setDone(false); setDifficulty(1); correctRef.current = 0
    fetchPuzzle(1)
  }
  useEffect(begin, [])

  function choose(opt) {
    if (picked || !puzzle) return
    setPicked(opt)
    const ok = String(opt) === String(puzzle.answer)
    let nextD = difficulty
    if (ok) { setScore((s) => s + 1); correctRef.current += 1; nextD = Math.min(4, difficulty + 1) }
    else nextD = Math.max(1, difficulty - 1)
    setDifficulty(nextD)
  }

  function next() {
    if (n + 1 >= PER_SESSION) {
      setDone(true)
      const acc = correctRef.current / PER_SESSION
      logResult('brainfog', 'puzzle', { accuracy: acc, score: Math.round(acc * 100), difficulty })
    } else {
      setN((x) => x + 1)
      fetchPuzzle(difficulty)
    }
  }

  if (!puzzle && !done) return <div className="content muted">Loading…</div>

  return (
    <div>
      <Link to="/brainfog" className="btn btn-sm btn-ghost">← Brain Fog</Link>
      <h1 style={{ marginTop: 12 }}>🧩 Clarity Puzzle</h1>
      <p className="lead">No pressure, no timer. Just a gentle little workout for your thinking.</p>

      {!done ? (
        <div className="card center pad-lg">
          <div className="muted">Puzzle {n + 1} / {PER_SESSION} · Level {difficulty}</div>
          <h2 style={{ margin: '16px 0 22px', maxWidth: '30ch' }}>{puzzle.prompt}</h2>

          <div className="choices" style={{ maxWidth: 460, margin: '0 auto' }}>
            {puzzle.options.map((opt) => {
              let cls = 'choice'
              if (picked) {
                if (String(opt) === String(puzzle.answer)) cls += ' correct'
                else if (opt === picked) cls += ' wrong'
              }
              return (
                <button key={opt} className={cls} disabled={!!picked} onClick={() => choose(opt)}>{opt}</button>
              )
            })}
          </div>

          {picked && (
            <div style={{ marginTop: 18 }}>
              <p className="muted">{String(picked) === String(puzzle.answer) ? '✅ Nice!' : `The answer was ${puzzle.answer}.`} {puzzle.explanation}</p>
              <button className="btn btn-primary btn-lg" onClick={next}>
                {n + 1 >= PER_SESSION ? 'Finish' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card center pad-lg">
          <div style={{ fontSize: '3rem' }}>{score >= PER_SESSION * 0.6 ? '🌟' : '🌱'}</div>
          <h2>{score} / {PER_SESSION} solved</h2>
          <p className="muted">Your brain is warming up. That counts.</p>
          <button className="btn btn-primary btn-lg" onClick={begin}>Another round</button>
        </div>
      )}
    </div>
  )
}

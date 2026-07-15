import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { logResult } from '../../components/ui.jsx'

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)

// Learn a small set of name-face pairs, then recall them. Builds associative memory.
export default function FaceName() {
  const [people, setPeople] = useState([])
  const [phase, setPhase] = useState('learn') // learn | quiz | done
  const [order, setOrder] = useState([])
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const correctRef = useRef(0)

  function load() {
    api.get('/content/facename?n=4').then((r) => {
      setPeople(r.people || [])
      setPhase('learn'); setQi(0); setScore(0); setPicked(null)
      correctRef.current = 0
    }).catch(() => {})
  }
  useEffect(load, [])

  function startQuiz() {
    setOrder(shuffle(people.map((_, i) => i)))
    setQi(0); setPicked(null); setPhase('quiz')
  }

  const target = phase === 'quiz' ? people[order[qi]] : null
  const options = target ? shuffle(people.map((p) => p.name)) : []

  function pick(name) {
    if (picked) return
    setPicked(name)
    if (name === target.name) { setScore((s) => s + 1); correctRef.current += 1 }
  }
  function next() {
    if (qi + 1 >= order.length) {
      setPhase('done')
      logResult('amnesia', 'facename', { accuracy: correctRef.current / (people.length || 1), score: correctRef.current })
    } else {
      setQi(qi + 1); setPicked(null)
    }
  }

  return (
    <div>
      <Link to="/amnesia" className="btn btn-sm btn-ghost">← Memory</Link>
      <h1 style={{ marginTop: 12 }}>🧑 Face & Name</h1>

      {phase === 'learn' && (
        <>
          <p className="lead">Meet these people and learn their names. Take as long as you like.</p>
          <div className="grid cols">
            {people.map((p, i) => (
              <div key={i} className="card center">
                <div style={{ fontSize: '4rem' }}>{p.face}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{p.name}</div>
              </div>
            ))}
          </div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 18 }}>
            <button className="btn btn-primary btn-lg" onClick={startQuiz}>I’m ready — quiz me</button>
          </div>
        </>
      )}

      {phase === 'quiz' && target && (
        <div className="card center pad-lg">
          <div className="muted">Question {qi + 1} / {order.length} · Score {score}</div>
          <div style={{ fontSize: '6rem', margin: '10px 0' }}>{target.face}</div>
          <h3>What’s their name?</h3>
          <div className="choices" style={{ maxWidth: 520, margin: '8px auto 0' }}>
            {options.map((name) => {
              let cls = 'choice'
              if (picked) {
                if (name === target.name) cls += ' correct'
                else if (name === picked) cls += ' wrong'
              }
              return <button key={name} className={cls} disabled={!!picked} onClick={() => pick(name)}>{name}</button>
            })}
          </div>
          {picked && (
            <div style={{ marginTop: 16 }}>
              <p className="muted">{picked === target.name ? '✅ Yes!' : `This is ${target.name}.`}</p>
              <button className="btn btn-primary btn-lg" onClick={next}>{qi + 1 >= order.length ? 'See results' : 'Next →'}</button>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="card center pad-lg">
          <div style={{ fontSize: '3rem' }}>{score >= people.length * 0.75 ? '🌟' : '👍'}</div>
          <h2>{score} / {people.length} remembered</h2>
          <button className="btn btn-primary btn-lg" onClick={load}>New faces</button>
        </div>
      )}
    </div>
  )
}

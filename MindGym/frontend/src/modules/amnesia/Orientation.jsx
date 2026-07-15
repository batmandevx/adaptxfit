import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { logResult, SpeakButton } from '../../components/ui.jsx'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// A calm daily grounding exercise: reassuring facts + a little active recall.
export default function Orientation() {
  const [o, setO] = useState(null)
  const [picked, setPicked] = useState(null)
  const [logged, setLogged] = useState(false)

  useEffect(() => { api.get('/content/orientation').then(setO).catch(() => {}) }, [])
  if (!o) return <div className="content muted">Loading…</div>

  const sentence = `Today is ${o.weekday}, the ${o.day}th of ${o.month}, ${o.year}. It is ${o.time} in the ${o.part_of_day}.`
  const options = [o.weekday, ...WEEKDAYS.filter((d) => d !== o.weekday).sort(() => Math.random() - 0.5).slice(0, 3)]
    .sort(() => Math.random() - 0.5)

  function pick(d) {
    if (picked) return
    setPicked(d)
    if (!logged) { logResult('amnesia', 'orientation', { accuracy: d === o.weekday ? 1 : 0, score: 1 }); setLogged(true) }
  }

  return (
    <div>
      <Link to="/amnesia" className="btn btn-sm btn-ghost">← Memory</Link>
      <h1 style={{ marginTop: 12 }}>🧭 Orientation</h1>
      <p className="lead">A gentle moment to ground yourself in the here and now.</p>

      <div className="card center pad-lg">
        <div style={{ fontSize: '4rem' }}>📅</div>
        <h2 style={{ fontSize: '2rem' }}>{o.weekday}</h2>
        <div style={{ fontSize: '1.4rem' }}>{o.day} {o.month} {o.year}</div>
        <div className="muted" style={{ fontSize: '1.2rem', marginTop: 6 }}>
          {o.time} · {o.part_of_day}
        </div>
        <div style={{ marginTop: 16 }}>
          <SpeakButton text={sentence} label="Read this to me" />
        </div>
        <p className="muted" style={{ maxWidth: '40ch', margin: '18px auto 0' }}>
          You are safe. You are here, right now. There is nothing you need to rush.
        </p>
      </div>

      <div className="card center" style={{ marginTop: 16 }}>
        <h3>Quick recall — what day is it today?</h3>
        <div className="choices" style={{ maxWidth: 520, margin: '10px auto 0' }}>
          {options.map((d) => {
            let cls = 'choice'
            if (picked) {
              if (d === o.weekday) cls += ' correct'
              else if (d === picked) cls += ' wrong'
            }
            return <button key={d} className={cls} disabled={!!picked} onClick={() => pick(d)}>{d}</button>
          })}
        </div>
        {picked && (
          <p className="muted" style={{ marginTop: 14 }}>
            {picked === o.weekday ? '✅ That’s right.' : `It’s ${o.weekday} today.`} Well done for checking in. 💚
          </p>
        )}
      </div>
    </div>
  )
}

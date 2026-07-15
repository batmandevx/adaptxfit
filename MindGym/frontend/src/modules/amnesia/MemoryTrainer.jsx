import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { logResult, SpeakButton } from '../../components/ui.jsx'

const RATINGS = [
  { q: 1, label: 'Again', hint: 'Forgot', cls: 'wrong' },
  { q: 3, label: 'Hard', hint: 'Tough', cls: '' },
  { q: 4, label: 'Good', hint: 'Recalled', cls: '' },
  { q: 5, label: 'Easy', hint: 'Instant', cls: 'correct' },
]

// Spaced-repetition flashcards. The backend SM-2 scheduler decides when each
// card comes back, so hard cards resurface sooner.
export default function MemoryTrainer() {
  const [tab, setTab] = useState('review') // review | manage
  const [due, setDue] = useState([])
  const [all, setAll] = useState([])
  const [pos, setPos] = useState(0)
  const [show, setShow] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const loadDue = () => api.get('/cards/due').then((d) => { setDue(d); setPos(0); setShow(false) }).catch(() => {})
  const loadAll = () => api.get('/cards').then(setAll).catch(() => {})
  useEffect(() => { loadDue(); loadAll() }, [])

  const card = due[pos]

  async function rate(q) {
    if (!card) return
    await api.post(`/cards/${card.id}/review`, { quality: q })
    setReviewed((r) => r + 1)
    if (pos + 1 >= due.length) {
      logResult('amnesia', 'memory', { score: reviewed + 1, accuracy: 1, details: { reviewed: reviewed + 1 } })
      loadDue(); loadAll()
    } else {
      setPos(pos + 1); setShow(false)
    }
  }

  return (
    <div>
      <Link to="/amnesia" className="btn btn-sm btn-ghost">← Memory</Link>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ marginTop: 12 }}>🧠 Memory Trainer</h1>
        <div className="row">
          <button className={`btn btn-sm ${tab === 'review' ? 'btn-primary' : ''}`} onClick={() => { setTab('review'); loadDue() }}>Review ({due.length})</button>
          <button className={`btn btn-sm ${tab === 'manage' ? 'btn-primary' : ''}`} onClick={() => { setTab('manage'); loadAll() }}>Manage cards</button>
        </div>
      </div>
      <p className="lead">Flashcards that come back at just the right moment to help things stick.</p>

      {tab === 'review' ? (
        card ? (
          <div className="card center pad-lg">
            <div className="muted">{pos + 1} of {due.length} due · {card.deck}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, margin: '24px 0', minHeight: '2em' }}>
              {card.front}
            </div>
            <SpeakButton text={card.front} label="Read question" />

            {!show ? (
              <div style={{ marginTop: 22 }}>
                <button className="btn btn-primary btn-lg" onClick={() => setShow(true)}>Show answer</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '1.3rem', margin: '22px 0', color: 'var(--good)' }}>{card.back}</div>
                <p className="muted">How well did you remember?</p>
                <div className="choices" style={{ maxWidth: 520, margin: '0 auto' }}>
                  {RATINGS.map((r) => (
                    <button key={r.q} className={`choice ${r.cls}`} onClick={() => rate(r.q)}>
                      {r.label}<br /><span style={{ fontSize: '.8rem', fontWeight: 400 }}>{r.hint}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="card center pad-lg">
            <div style={{ fontSize: '3rem' }}>🎉</div>
            <h2>All caught up!</h2>
            <p className="muted">No cards are due right now. Add more in “Manage cards”, or come back later.</p>
            <button className="btn" onClick={() => setTab('manage')}>Manage cards</button>
          </div>
        )
      ) : (
        <ManageCards all={all} reload={() => { loadAll(); loadDue() }} />
      )}
    </div>
  )
}

function ManageCards({ all, reload }) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [deck, setDeck] = useState('General')
  const [editing, setEditing] = useState(null)

  async function add() {
    if (!front.trim() || !back.trim()) return
    await api.post('/cards', { front, back, deck: deck || 'General' })
    setFront(''); setBack('')
    reload()
  }
  async function save(id, f, b, d) {
    await api.put(`/cards/${id}`, { front: f, back: b, deck: d })
    setEditing(null); reload()
  }
  async function del(id) { await api.del(`/cards/${id}`); reload() }

  return (
    <div className="stack">
      <div className="card stack">
        <h3>Add a card</h3>
        <input type="text" placeholder="Front (the prompt / question)" value={front} onChange={(e) => setFront(e.target.value)} />
        <input type="text" placeholder="Back (the answer to remember)" value={back} onChange={(e) => setBack(e.target.value)} />
        <div className="row">
          <input type="text" placeholder="Deck" value={deck} onChange={(e) => setDeck(e.target.value)} style={{ width: 160 }} />
          <button className="btn btn-primary" onClick={add}>＋ Add card</button>
        </div>
      </div>

      <div className="stack">
        {all.map((c) => (
          <div key={c.id} className="card">
            {editing === c.id ? (
              <EditRow card={c} onSave={save} onCancel={() => setEditing(null)} />
            ) : (
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{c.front}</strong><br />
                  <span className="muted">{c.back}</span>
                  <div className="muted" style={{ fontSize: '.78rem' }}>{c.deck} · due {c.due}</div>
                </div>
                <div className="row">
                  <button className="btn btn-sm" onClick={() => setEditing(c.id)}>Edit</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => del(c.id)}>🗑</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function EditRow({ card, onSave, onCancel }) {
  const [f, setF] = useState(card.front)
  const [b, setB] = useState(card.back)
  const [d, setD] = useState(card.deck)
  return (
    <div className="stack">
      <input type="text" value={f} onChange={(e) => setF(e.target.value)} />
      <input type="text" value={b} onChange={(e) => setB(e.target.value)} />
      <div className="row">
        <input type="text" value={d} onChange={(e) => setD(e.target.value)} style={{ width: 160 }} />
        <button className="btn btn-sm btn-primary" onClick={() => onSave(card.id, f, b, d)}>Save</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { logResult } from '../../components/ui.jsx'

// A searchable memory journal: capture the day, find anything again later.
export default function Journal() {
  const [entries, setEntries] = useState([])
  const [text, setText] = useState('')
  const [q, setQ] = useState('')

  const load = (query = '') =>
    api.get(`/journal${query ? `?q=${encodeURIComponent(query)}` : ''}`).then(setEntries).catch(() => {})
  useEffect(() => { load() }, [])

  async function add() {
    if (!text.trim()) return
    await api.post('/journal', { text: text.trim(), tags: [] })
    setText('')
    logResult('amnesia', 'journal', { score: 1, accuracy: 1 })
    load(q)
  }
  async function del(id) { await api.del(`/journal/${id}`); load(q) }

  return (
    <div>
      <Link to="/amnesia" className="btn btn-sm btn-ghost">← Memory</Link>
      <h1 style={{ marginTop: 12 }}>📓 Memory Journal</h1>
      <p className="lead">Write down what happened today. Future-you will thank you.</p>

      <div className="card stack">
        <textarea rows={3} value={text} placeholder="What happened today? Who did you see? How did you feel?"
          onChange={(e) => setText(e.target.value)} style={{ fontSize: '1.05rem' }} />
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={add}>＋ Save entry</button>
        </div>
      </div>

      <div className="row" style={{ margin: '18px 0' }}>
        <input type="search" placeholder="🔍 Search your memories…" value={q}
          onChange={(e) => { setQ(e.target.value); load(e.target.value) }} style={{ flex: 1 }} />
      </div>

      <div className="stack">
        {entries.length === 0 ? (
          <div className="card muted center">{q ? 'No entries match that search.' : 'No entries yet — write your first one above.'}</div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{e.text}</div>
                <button className="btn btn-sm btn-ghost" onClick={() => del(e.id)}>🗑</button>
              </div>
              <div className="muted" style={{ fontSize: '.78rem', marginTop: 6 }}>
                {new Date(e.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

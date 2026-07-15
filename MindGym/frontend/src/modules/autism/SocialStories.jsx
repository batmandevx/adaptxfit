import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { logResult, SpeakButton } from '../../components/ui.jsx'

// Step-by-step guides for everyday social moments. Calm, predictable, reassuring.
export default function SocialStories() {
  const [stories, setStories] = useState([])
  const [open, setOpen] = useState(0)
  const [practised, setPractised] = useState({})

  useEffect(() => { api.get('/content/stories').then(setStories).catch(() => {}) }, [])

  function markPractised(idx, title) {
    if (practised[idx]) return
    setPractised((p) => ({ ...p, [idx]: true }))
    logResult('autism', 'stories', { score: 1, accuracy: 1, details: { story: title } })
  }

  return (
    <div>
      <Link to="/autism" className="btn btn-sm btn-ghost">← Autism</Link>
      <h1 style={{ marginTop: 12 }}>💬 Social Stories</h1>
      <p className="lead">Gentle, step-by-step guides. Read one before a moment that feels tricky.</p>

      <div className="stack">
        {stories.map((s, idx) => {
          const isOpen = open === idx
          return (
            <div key={idx} className="card">
              <button
                onClick={() => setOpen(isOpen ? -1 : idx)}
                aria-expanded={isOpen}
                style={{ all: 'unset', cursor: 'pointer', width: '100%' }}
              >
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    <span style={{ fontSize: '1.6rem', marginRight: 10 }}>{s.icon}</span>{s.title}
                  </span>
                  <span className="row">
                    {practised[idx] && <span className="pill done">✓ Practised</span>}
                    <span aria-hidden>{isOpen ? '▾' : '▸'}</span>
                  </span>
                </div>
              </button>

              {isOpen && (
                <div style={{ marginTop: 14 }}>
                  <ol style={{ fontSize: '1.1rem', lineHeight: 1.9, paddingLeft: 24 }}>
                    {s.steps.map((step, j) => <li key={j} style={{ marginBottom: 6 }}>{step}</li>)}
                  </ol>
                  <div className="row" style={{ marginTop: 8 }}>
                    <SpeakButton text={`${s.title}. ${s.steps.join('. ')}`} label="Read this story" />
                    <button className="btn btn-sm btn-primary" onClick={() => markPractised(idx, s.title)}>
                      I’ve read this
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

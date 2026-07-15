import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { logResult, useToast } from '../../components/ui.jsx'
import { ProgressBar } from '../../components/ui.jsx'

const KEY = 'mindgym.taskbreakdown'

// Shrink an overwhelming task into tiny checkable steps. Persists locally.
export default function TaskBreakdown() {
  const [toast, showToast] = useToast()
  const [task, setTask] = useState('')
  const [steps, setSteps] = useState([])
  const [draft, setDraft] = useState('')
  const celebrated = useRef(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (saved) { setTask(saved.task || ''); setSteps(saved.steps || []) }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ task, steps }))
  }, [task, steps])

  const done = steps.filter((s) => s.done).length
  const allDone = steps.length > 0 && done === steps.length

  useEffect(() => {
    if (allDone && !celebrated.current) {
      celebrated.current = true
      showToast('🎉 Every step done — amazing work!')
      logResult('adhd', 'tasks', { score: steps.length, accuracy: 1, details: { steps: steps.length } })
    }
    if (!allDone) celebrated.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, steps.length])

  function addStep() {
    const t = draft.trim()
    if (!t) return
    setSteps((s) => [...s, { id: Date.now() + Math.random(), text: t, done: false }])
    setDraft('')
  }
  function toggle(id) {
    setSteps((s) => s.map((x) => (x.id === id ? { ...x, done: !x.done } : x)))
  }
  function remove(id) {
    setSteps((s) => s.filter((x) => x.id !== id))
  }
  function startFresh() {
    setTask(''); setSteps([]); setDraft(''); celebrated.current = false
  }

  return (
    <div>
      <Link to="/adhd" className="btn btn-sm btn-ghost">← ADHD</Link>
      <h1 style={{ marginTop: 12 }}>✅ Task Breakdown</h1>
      <p className="lead">
        Big tasks feel heavy. Break one into the smallest possible steps, then tick them off —
        one tiny win at a time.
      </p>

      <div className="card stack">
        <div>
          <label className="muted">The task that feels big</label>
          <input
            type="text" value={task} placeholder="e.g. Tidy my room"
            onChange={(e) => setTask(e.target.value)} style={{ width: '100%', fontSize: '1.1rem' }}
          />
        </div>

        <div>
          <label className="muted">Add a tiny first step</label>
          <div className="row">
            <input
              type="text" value={draft} placeholder="e.g. Pick up 5 things off the floor"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStep()}
              style={{ flex: 1, minWidth: 200 }}
            />
            <button className="btn btn-primary" onClick={addStep}>＋ Add step</button>
          </div>
        </div>
      </div>

      {steps.length > 0 && (
        <div className="card stack" style={{ marginTop: 18 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>{done} / {steps.length} done</h3>
            {allDone && <span className="pill done">All complete 🎉</span>}
          </div>
          <ProgressBar value={done} max={steps.length} />
          <div className="stack" style={{ gap: 8 }}>
            {steps.map((s) => (
              <div key={s.id} className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
                <label className="row" style={{ gap: 12, cursor: 'pointer', flex: 1 }}>
                  <input type="checkbox" checked={s.done} onChange={() => toggle(s.id)}
                    style={{ width: 22, height: 22 }} />
                  <span style={{ textDecoration: s.done ? 'line-through' : 'none', opacity: s.done ? 0.6 : 1, fontSize: '1.05rem' }}>
                    {s.text}
                  </span>
                </label>
                <button className="btn btn-sm btn-ghost" aria-label="Remove step" onClick={() => remove(s.id)}>✕</button>
              </div>
            ))}
          </div>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-sm" onClick={startFresh}>Start a new task</button>
          </div>
        </div>
      )}
      {toast}
    </div>
  )
}

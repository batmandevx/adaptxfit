import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { Loading } from './ui.jsx'

// Generic landing page for a single module, built from the backend catalog
// so it never drifts out of sync with the available exercises.
export default function ModuleHome({ moduleId }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    api.get('/content/catalog').then(setData).catch(() => {})
  }, [])

  if (!data) return <Loading />
  const mod = data.modules[moduleId]
  const items = data.catalog.filter((c) => c.module === moduleId)

  return (
    <div>
      <h1>{mod.icon} {mod.title}</h1>
      <p className="lead">{mod.blurb}</p>
      <div className="grid cols">
        {items.map((it) => (
          <Link key={it.id} to={it.route} className="card ex-card">
            <div className="ex-icon">{it.icon}</div>
            <div className="ex-title">{it.title}</div>
            <div className="ex-desc">{it.desc}</div>
            <div className="ex-meta"><span className="pill">~{it.est_min} min</span></div>
          </Link>
        ))}
      </div>
    </div>
  )
}

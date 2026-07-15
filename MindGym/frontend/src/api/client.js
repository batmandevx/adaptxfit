// Tiny fetch wrapper. All requests go through Vite's /api proxy to FastAPI.
const BASE = '/api'

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`${res.status} ${detail}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
  get: (p) => req(p),
  post: (p, body) => req(p, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: (p, body) => req(p, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  del: (p) => req(p, { method: 'DELETE' }),
}

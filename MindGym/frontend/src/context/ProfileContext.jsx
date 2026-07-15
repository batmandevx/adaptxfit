import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

// Loads the single local profile (name, conditions, onboarded) from the backend.
const Ctx = createContext(null)
export const useProfile = () => useContext(Ctx)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const p = await api.get('/profile')
      setProfile(p)
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const update = useCallback(async (patch) => {
    const p = await api.put('/profile', patch)
    setProfile(p)
    return p
  }, [])

  return (
    <Ctx.Provider value={{ profile, loading, error, reload: load, update }}>
      {children}
    </Ctx.Provider>
  )
}

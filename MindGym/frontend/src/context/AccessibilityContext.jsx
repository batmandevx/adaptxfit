import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Single source of truth for accessibility settings. Applies them to the
// document root (data-* attrs + --fs variable) and persists to localStorage.
const KEY = 'mindgym.a11y'
const DEFAULTS = {
  theme: 'calm',        // calm | light | dark | contrast
  font: 'system',       // system | dyslexic | serif
  fontScale: 1,         // 0.85 .. 1.6
  reducedMotion: false,
  tts: true,            // read-aloud enabled
}

const Ctx = createContext(null)
export const useA11y = () => useContext(Ctx)

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
    } catch {
      return { ...DEFAULTS }
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', settings.theme)
    root.setAttribute('data-font', settings.font)
    root.setAttribute('data-motion', settings.reducedMotion ? 'reduced' : 'full')
    root.style.setProperty('--fs', String(settings.fontScale))
    localStorage.setItem(KEY, JSON.stringify(settings))
  }, [settings])

  const set = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [])

  const speak = useCallback(
    (text) => {
      if (!settings.tts || typeof window === 'undefined' || !('speechSynthesis' in window)) return
      try {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(String(text))
        u.rate = 0.95
        u.pitch = 1
        window.speechSynthesis.speak(u)
      } catch {
        /* speech not available - silently ignore */
      }
    },
    [settings.tts],
  )

  const stopSpeak = useCallback(() => {
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <Ctx.Provider value={{ settings, set, speak, stopSpeak }}>{children}</Ctx.Provider>
  )
}

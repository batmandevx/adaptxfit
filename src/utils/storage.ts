// Tiny, defensive localStorage helpers. All access is wrapped so the app keeps
// working in private-mode / storage-disabled browsers (graceful degradation).

export function loadJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — continue in-memory only */
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}

export const STORAGE_KEYS = {
  profile: 'amg.profile.v1',
  accessibility: 'amg.accessibility.v1',
  reminders: 'amg.reminders.v1',
} as const;

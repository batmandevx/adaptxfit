/**
 * AmbientBackground — the fixed Clinical Aurora ambient layer
 * (shell.md §1.1): global aurora gradient + noise texture at 3% opacity.
 * Pure CSS (`.app-ambient` in globals.css); static, so safe for reduced
 * motion; removed entirely in high-contrast mode.
 */

export function AmbientBackground() {
  return <div className="app-ambient" aria-hidden="true" />;
}

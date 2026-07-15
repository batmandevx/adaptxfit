import { useAccessibility } from '../context/AccessibilityContext';

interface HeaderProps {
  onHome: () => void;
  onBack?: () => void;
  onOpenA11y: () => void;
  onProfile: () => void;
  hasProfile: boolean;
  confidencePoints?: number;
}

export function Header({ onHome, onBack, onOpenA11y, onProfile, hasProfile, confidencePoints }: HeaderProps) {
  const { settings, toggleTheme } = useAccessibility();
  const isDark = settings.theme === 'dark';
  return (
    <header className="app-header">
      <div className="header-left">
        {onBack ? (
          <button className="icon-btn header-back" onClick={onBack} aria-label="Go back">
            <span aria-hidden="true">←</span> <span className="header-label">Back</span>
          </button>
        ) : null}
        <button
          className="brand"
          onClick={onHome}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Adaptive Motion Gym home"
        >
          <span className="brand-mark" aria-hidden="true">
            ◆
          </span>
          <span className="brand-text">
            <strong>Adaptive Motion Gym</strong>
            <span>Your pace. Your ability. Your movement.</span>
          </span>
        </button>
      </div>
      <div className="header-actions">
        {hasProfile && typeof confidencePoints === 'number' ? (
          <span className="tag tag--support header-cp" title="Confidence Points">
            ✨ {confidencePoints} CP
          </span>
        ) : null}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-pressed={isDark}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
          <span className="header-label">{isDark ? 'Light' : 'Dark'}</span>
        </button>
        {hasProfile ? (
          <button className="icon-btn" onClick={onProfile}>
            <span aria-hidden="true">👤</span> <span className="header-label">Profile</span>
          </button>
        ) : null}
        <button className="icon-btn" onClick={onOpenA11y} aria-haspopup="dialog">
          <span aria-hidden="true">♿</span> <span className="header-label">Accessibility</span>
        </button>
      </div>
    </header>
  );
}

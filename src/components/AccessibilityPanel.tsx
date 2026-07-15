import { useEffect, useRef } from 'react';
import type { ColorVisionMode, ThemeMode } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import type { BooleanSettingKey } from '../context/AccessibilityContext';
import { Segmented, Toggle } from './Inputs';

interface AccessibilityPanelProps {
  open: boolean;
  onClose: () => void;
}

const CONTROLS: { key: BooleanSettingKey; label: string; description: string }[] = [
  { key: 'highContrast', label: 'High contrast', description: 'Maximise text and border contrast' },
  { key: 'largeText', label: 'Large text', description: 'Increase text size across the app' },
  { key: 'reducedMotion', label: 'Reduced motion', description: 'Minimise animations and transitions' },
  { key: 'dyslexiaFont', label: 'Dyslexia-friendly font', description: 'Switch to a clearer font with extra spacing' },
  { key: 'simpleLanguage', label: 'Simple language', description: 'Shorter, plainer instructions' },
  { key: 'voiceGuidance', label: 'Voice guidance', description: 'Read movements aloud during a session' },
  { key: 'captions', label: 'Captions / text instructions', description: 'Always show written step-by-step text' },
  { key: 'soundCues', label: 'Sound cues', description: 'Gentle beeps for the countdown and rest timer' },
];

const THEME_OPTIONS = [
  { value: 'light', label: '☀️ Light' },
  { value: 'dark', label: '🌙 Dark' },
];

const COLOR_VISION_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'deuteranopia', label: 'Deuteranopia' },
  { value: 'protanopia', label: 'Protanopia' },
  { value: 'tritanopia', label: 'Tritanopia' },
];

export function AccessibilityPanel({ open, onClose }: AccessibilityPanelProps) {
  const { settings, toggle, setTheme, setColorVision, reset } = useAccessibility();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="a11y-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="a11y-panel" role="dialog" aria-modal="true" aria-label="Accessibility settings">
        <div className="row-between" style={{ marginBottom: 'var(--space-3)' }}>
          <h2 style={{ margin: 0 }}>Accessibility</h2>
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close accessibility settings">
            ✕ Close
          </button>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          These settings apply across Adaptive Motion Gym and are saved on this device.
        </p>

        <div className="a11y-row">
          <div className="field" style={{ margin: 0 }}>
            <span className="field-label">Theme</span>
            <Segmented
              label="Theme"
              options={THEME_OPTIONS}
              value={settings.theme}
              onChange={(v) => setTheme(v as ThemeMode)}
            />
          </div>
        </div>

        <div className="a11y-row">
          <div className="field" style={{ margin: 0 }}>
            <span className="field-label">Colour vision</span>
            <p className="field-hint" style={{ marginBottom: 8 }}>
              Adjusts status colours for colour blindness. Meaning is always also shown with icons and text.
            </p>
            <div className="option-grid" role="radiogroup" aria-label="Colour vision palette">
              {COLOR_VISION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={settings.colorVision === opt.value}
                  className={`option ${settings.colorVision === opt.value ? 'option--selected' : ''}`}
                  onClick={() => setColorVision(opt.value as ColorVisionMode)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {CONTROLS.map((control) => (
            <div className="a11y-row" key={control.key}>
              <Toggle
                label={control.label}
                description={control.description}
                checked={settings[control.key]}
                onChange={() => toggle(control.key)}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <button className="btn btn--subtle btn--block" onClick={reset}>
            Reset accessibility settings
          </button>
        </div>
      </aside>
    </div>
  );
}

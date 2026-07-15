import { useReminders } from '../context/RemindersContext';
import { Toggle } from './Inputs';

export function RemindersCard() {
  const { settings, permission, requestPermission, update } = useReminders();

  return (
    <div className="card stack" aria-label="Workout reminders">
      <div className="row-between">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Workout reminders</h2>
          <p className="muted" style={{ margin: '2px 0 0' }}>A gentle daily nudge to move at your pace.</p>
        </div>
        <span className="tag tag--info">Optional</span>
      </div>

      <Toggle
        label="Daily reminder"
        description="A gentle reminder to move each day"
        checked={settings.enabled}
        onChange={(v) => update({ enabled: v })}
      />

      {settings.enabled ? (
        <>
          <label className="field" style={{ display: 'block', margin: 0 }}>
            <span className="field-label" style={{ fontSize: '0.95rem' }}>
              Reminder time
            </span>
            <input
              className="text-input"
              type="time"
              value={settings.time}
              onChange={(e) => update({ time: e.target.value })}
              style={{ maxWidth: 160 }}
              aria-label="Reminder time"
            />
          </label>

          {permission === 'granted' ? (
            <div className="notice notice--success">
              <span className="ic" aria-hidden="true">✅</span>
              <span>Notifications are on. You will get a reminder around {settings.time} while the app is open.</span>
            </div>
          ) : permission === 'denied' ? (
            <div className="notice notice--info">
              <span className="ic" aria-hidden="true">ℹ️</span>
              <span>Notifications are blocked in your browser, so we will show an in-app reminder when it is time instead.</span>
            </div>
          ) : permission === 'unsupported' ? (
            <div className="notice notice--info">
              <span className="ic" aria-hidden="true">ℹ️</span>
              <span>Your browser does not support notifications, so we will show an in-app reminder when it is time instead.</span>
            </div>
          ) : (
            <div className="btn-row">
              <button className="btn btn--accent btn--sm" onClick={requestPermission}>
                Enable notifications
              </button>
            </div>
          )}

          <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>
            Reminders fire while Adaptive Motion Gym is open in your browser. For reminders when the app is closed, an
            installed app or push service would be needed.
          </p>
        </>
      ) : null}
    </div>
  );
}

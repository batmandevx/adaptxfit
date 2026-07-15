import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ReminderSettings } from '../types';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../utils/storage';

type Permission = NotificationPermission | 'unsupported';

interface RemindersContextValue {
  settings: ReminderSettings;
  permission: Permission;
  /** True when today's reminder time has passed and it has not fired yet. */
  dueToday: boolean;
  requestPermission: () => Promise<void>;
  update: (partial: Partial<ReminderSettings>) => void;
  acknowledgeToday: () => void;
}

const RemindersContext = createContext<RemindersContextValue | null>(null);

const pad = (n: number) => n.toString().padStart(2, '0');
const todayKey = () => new Date().toISOString().slice(0, 10);
const nowHHMM = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function RemindersProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReminderSettings>(
    () => loadJSON<ReminderSettings>(STORAGE_KEYS.reminders) ?? { enabled: false, time: '18:00' },
  );
  const [permission, setPermission] = useState<Permission>(
    notificationsSupported() ? Notification.permission : 'unsupported',
  );
  const [tick, setTick] = useState(0); // forces re-evaluation of dueToday

  useEffect(() => {
    saveJSON(STORAGE_KEYS.reminders, settings);
  }, [settings]);

  // While the app is open, check once a minute whether to fire the reminder.
  useEffect(() => {
    if (!settings.enabled) return;
    const check = () => {
      setTick((t) => t + 1);
      if (permission !== 'granted') return;
      const today = todayKey();
      if (nowHHMM() >= settings.time && settings.lastNotified !== today) {
        try {
          new Notification('Adaptive Motion Gym', {
            body: 'Your movement reminder — ready when you are. Your pace, your ability.',
          });
        } catch {
          /* ignore */
        }
        setSettings((s) => ({ ...s, lastNotified: today }));
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [settings.enabled, settings.time, settings.lastNotified, permission]);

  const requestPermission = useCallback(async () => {
    if (!notificationsSupported()) {
      setPermission('unsupported');
      return;
    }
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
    } catch {
      setPermission(Notification.permission);
    }
  }, []);

  const update = useCallback((partial: Partial<ReminderSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  const acknowledgeToday = useCallback(() => {
    setSettings((s) => ({ ...s, lastNotified: todayKey() }));
  }, []);

  const dueToday = useMemo(() => {
    void tick; // re-evaluate on each scheduler tick
    return settings.enabled && nowHHMM() >= settings.time && settings.lastNotified !== todayKey();
  }, [settings.enabled, settings.time, settings.lastNotified, tick]);

  const value = useMemo(
    () => ({ settings, permission, dueToday, requestPermission, update, acknowledgeToday }),
    [settings, permission, dueToday, requestPermission, update, acknowledgeToday],
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders(): RemindersContextValue {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders must be used within RemindersProvider');
  return ctx;
}

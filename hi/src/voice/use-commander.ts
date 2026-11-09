'use client';

/**
 * Voice Commander 2.0 — React wiring.
 *
 * `VoiceCommanderProvider` owns the intent-handler registry. Any mounted
 * section (e.g. Live Coach) registers handlers for the intents it can act on;
 * transcripts flow in from `voice-input.tsx` via `processTranscript`, get
 * matched by the pure commander, dispatched, and confirmed aloud + via the
 * aria-live announcer.
 *
 * Built-in routing (no registration needed):
 *   navigate        → onNavigate(section)
 *   log.water       → onNavigate('dashboard')  (hydration tracker lives there)
 *   log.pain        → onNavigate('dashboard')  (pain journal lives there)
 *   session.*       → if no handler is mounted yet, navigates to 'live-coach'
 *                     and stashes the intent; it fires as soon as a handler
 *                     registers (true hands-free "start workout" from anywhere)
 *
 * i18n seam: pass a locale-specific intent table as the `table` prop
 * (see buildIntentTable in intents.ts). Default is English; nothing here
 * imports src/lib/i18n.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { matchCommand } from './commander';
import { announcer } from './announcer';
import {
  INTENT_TABLE,
  type IntentDef,
  type SectionId,
  type VoiceIntent,
  type VoiceIntentType,
} from './intents';

export type IntentHandler = (intent: VoiceIntent) => void;

export interface CommanderContextValue {
  /**
   * Route a raw transcript through the commander. Returns the matched intent
   * when one was executed (caller should treat the transcript as consumed),
   * or null so the caller can fall back to legacy behavior.
   */
  processTranscript: (text: string) => VoiceIntent | null;
  /** Register a handler for an intent type. Returns an unsubscribe fn. */
  registerHandler: (type: VoiceIntentType, handler: IntentHandler) => () => void;
  /** The most recently executed intent (for indicators / debugging). */
  lastIntent: VoiceIntent | null;
  /** The active intent table (help overlay lists commands from this). */
  table: IntentDef[];
}

const VoiceCommanderContext = createContext<CommanderContextValue | null>(null);

export interface VoiceCommanderProviderProps {
  children: React.ReactNode;
  /** Section navigation callback (page passes setActiveSection). */
  onNavigate?: (section: SectionId) => void;
  /** i18n seam — locale-specific table; defaults to the English INTENT_TABLE. */
  table?: IntentDef[];
}

const SESSION_PREFIX = 'session.';

export function VoiceCommanderProvider({
  children,
  onNavigate,
  table = INTENT_TABLE,
}: VoiceCommanderProviderProps) {
  const handlersRef = useRef<Map<VoiceIntentType, Set<IntentHandler>>>(new Map());
  const pendingRef = useRef<VoiceIntent[]>([]);
  const [lastIntent, setLastIntent] = useState<VoiceIntent | null>(null);

  const onNavigateRef = useRef(onNavigate);
  const tableRef = useRef(table);
  useEffect(() => {
    onNavigateRef.current = onNavigate;
    tableRef.current = table;
  }, [onNavigate, table]);

  const runHandlers = useCallback((intent: VoiceIntent) => {
    const set = handlersRef.current.get(intent.type);
    set?.forEach((handler) => {
      try {
        handler(intent);
      } catch (err) {
        console.warn(`[voice-commander] handler for ${intent.type} failed:`, err);
      }
    });
    return (set?.size ?? 0) > 0;
  }, []);

  const dispatch = useCallback(
    (intent: VoiceIntent) => {
      if (intent.type === 'navigate' && intent.section) {
        onNavigateRef.current?.(intent.section);
      } else if (intent.type === 'log.water' || intent.type === 'log.pain') {
        // Hydration tracker + pain journal both live on the dashboard.
        onNavigateRef.current?.('dashboard');
      }

      const hadHandler = runHandlers(intent);

      if (!hadHandler && intent.type.startsWith(SESSION_PREFIX)) {
        // No section is listening yet — open Live Coach and replay the intent
        // as soon as it registers its handlers.
        if (!pendingRef.current.some((p) => p.type === intent.type)) {
          pendingRef.current.push(intent);
        }
        onNavigateRef.current?.('live-coach');
      }

      setLastIntent(intent);
      announcer.speakConfirmation(intent);
    },
    [runHandlers],
  );

  const processTranscript = useCallback(
    (text: string): VoiceIntent | null => {
      const intent = matchCommand(text, tableRef.current);
      if (!intent) return null;
      dispatch(intent);
      return intent;
    },
    [dispatch],
  );

  const registerHandler = useCallback(
    (type: VoiceIntentType, handler: IntentHandler) => {
      let set = handlersRef.current.get(type);
      if (!set) {
        set = new Set();
        handlersRef.current.set(type, set);
      }
      set.add(handler);

      // Replay any intents stashed while no handler was mounted.
      const pending = pendingRef.current.filter((p) => p.type === type);
      if (pending.length > 0) {
        pendingRef.current = pendingRef.current.filter((p) => p.type !== type);
        // Defer so the registering component finishes mounting first.
        window.setTimeout(() => {
          pending.forEach((intent) => {
            try {
              handler(intent);
            } catch (err) {
              console.warn(`[voice-commander] deferred ${type} handler failed:`, err);
            }
          });
        }, 300);
      }

      return () => {
        set.delete(handler);
      };
    },
    [],
  );

  const value = useMemo<CommanderContextValue>(
    () => ({ processTranscript, registerHandler, lastIntent, table }),
    [processTranscript, registerHandler, lastIntent, table],
  );

  return React.createElement(VoiceCommanderContext.Provider, { value }, children);
}

/**
 * Access the commander. Returns null when no provider is mounted so components
 * (e.g. voice-input used standalone) can degrade gracefully.
 */
export function useCommander(): CommanderContextValue | null {
  return useContext(VoiceCommanderContext);
}

/**
 * Voice Commander 2.0 — announcer.
 *
 * Singleton that owns two output channels:
 *   (a) a visually-hidden `aria-live="polite"` region (screen readers), and
 *   (b) a speechSynthesis queue with cancel-on-new-command semantics.
 *
 * `page.tsx` renders the live region declaratively (id below); if it is
 * missing the announcer creates one lazily, so it is safe to call from any
 * component. Everything is guarded for SSR — calls on the server are no-ops.
 *
 * TTS gating reads the *existing* accessibility store (ttsEnabled, voiceSpeed)
 * — read-only, per v2 scope rules. Command confirmations pass `force: true`
 * because a user who just issued a voice command needs audible feedback even
 * if ambient TTS is off.
 */

import { INTENT_TABLE, type VoiceIntent } from './intents';
import { useAccessibilityStore } from '@/stores/accessibility-store';
import { speechLocale } from '@/lib/i18n';

export const ANNOUNCER_REGION_ID = 'voice-commander-live-region';

export interface AnnounceOptions {
  /** Also speak via speechSynthesis (default true, gated by the user's TTS pref). */
  speak?: boolean;
  /** Bypass the ttsEnabled preference (used for command confirmations). */
  force?: boolean;
  /**
   * When true (default), cancel any queued/in-progress speech before this
   * message — "cancel on new command". When false, append to the queue.
   */
  interrupt?: boolean;
}

interface QueueItem {
  text: string;
  rate: number;
}

class Announcer {
  private queue: QueueItem[] = [];
  private speaking = false;
  private lastMessage = '';

  // ── aria-live region ───────────────────────────────────────────────────────

  private ensureRegion(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    let el = document.getElementById(ANNOUNCER_REGION_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = ANNOUNCER_REGION_ID;
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.className = 'sr-only';
      document.body.appendChild(el);
    }
    return el;
  }

  private writeRegion(message: string): void {
    const el = this.ensureRegion();
    if (!el) return;
    // Clear-then-set so identical consecutive messages are re-announced by SRs.
    el.textContent = '';
    // Zero-width space keeps the node non-empty for SRs that skip empty nodes.
    window.setTimeout(() => {
      el.textContent = message || '​';
    }, 40);
  }

  // ── speech queue ───────────────────────────────────────────────────────────

  private ttsPrefs(): { enabled: boolean; rate: number } {
    try {
      const s = useAccessibilityStore.getState();
      return { enabled: s.ttsEnabled, rate: s.voiceSpeed || 1 };
    } catch {
      return { enabled: true, rate: 1 };
    }
  }

  private speechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private pump(): void {
    if (!this.speechSupported() || this.speaking) return;
    const next = this.queue.shift();
    if (!next) return;
    this.speaking = true;
    try {
      const u = new SpeechSynthesisUtterance(next.text);
      u.rate = next.rate;
      // Multilingual coaching (Pillar B): speak in the user's selected locale
      // and prefer a matching system voice when one is installed.
      try {
        const locale = useAccessibilityStore.getState().locale;
        const tag = speechLocale(locale);
        u.lang = tag;
        const voices = window.speechSynthesis.getVoices();
        const match =
          voices.find((v) => v.lang === tag) ||
          voices.find((v) => v.lang?.toLowerCase().startsWith(tag.split('-')[0].toLowerCase()));
        if (match) u.voice = match;
      } catch {
        /* keep default voice */
      }
      const done = () => {
        this.speaking = false;
        this.pump();
      };
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
    } catch {
      this.speaking = false;
    }
  }

  // ── public API ─────────────────────────────────────────────────────────────

  /**
   * Announce a message to screen readers (aria-live region) and, optionally,
   * aloud via speech synthesis.
   */
  announce(message: string, options: AnnounceOptions = {}): void {
    const { speak = true, force = false, interrupt = true } = options;
    if (!message) return;
    this.lastMessage = message;
    this.writeRegion(message);

    if (!speak || !this.speechSupported()) return;
    const prefs = this.ttsPrefs();
    if (!force && !prefs.enabled) return;

    if (interrupt) {
      this.queue = [];
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* best effort */
      }
      this.speaking = false;
    }
    this.queue.push({ text: message, rate: prefs.rate });
    this.pump();
  }

  /** Speak the confirmation phrase for an executed intent (always aloud). */
  speakConfirmation(intent: VoiceIntent): void {
    const def = INTENT_TABLE.find(
      (d) => d.type === intent.type && (intent.type !== 'navigate' || d.section === intent.section),
    );
    const text = def?.confirmation ?? `${intent.label}.`;
    this.announce(text, { speak: true, force: true, interrupt: true });
  }

  /** The most recent announced message (useful for tests / debugging). */
  getLastMessage(): string {
    return this.lastMessage;
  }

  /** Cancel pending + in-progress speech (does not clear the live region). */
  stopSpeaking(): void {
    this.queue = [];
    if (this.speechSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* best effort */
      }
    }
    this.speaking = false;
  }
}

export const announcer = new Announcer();

/** Functional shortcut matching the spec: `announce(msg, { speak })`. */
export function announce(message: string, options?: AnnounceOptions): void {
  announcer.announce(message, options);
}

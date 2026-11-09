"use client";

/**
 * AdaptiFit v2 — PWA install prompt + offline banner (Offline-First pillar).
 *
 * - Shows an "Install AdaptiFit — works offline" card when the browser fires
 *   `beforeinstallprompt`. Dismissal is remembered in localStorage.
 * - Shows an amber banner while `navigator.onLine === false` so users know the
 *   app keeps working and their logs will sync when back online.
 * - When the offline outbox finishes replaying queued writes, a success toast
 *   confirms the sync.
 *
 * Accessibility: live regions use role="status" + aria-live="polite".
 */

import { useEffect, useRef, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useOutbox } from "@/lib/offline/use-outbox";
import { useReduced } from "@/components/ui/aurora";

const DISMISS_KEY = "adaptifit:pwa-install-dismissed:v1";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaInstall() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true); // hidden until we know otherwise
  const [isOnline, setIsOnline] = useState(true);
  // iOS Safari never fires beforeinstallprompt — show manual instructions
  // instead of leaving iPhone users with zero install affordance.
  const [isIos, setIsIos] = useState(false);
  const { pending, flush } = useOutbox();
  const hadPendingRef = useRef(false);
  const reduced = useReduced();

  // --- Install prompt (beforeinstallprompt) -------------------------------
  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    setIsIos(
      /iP(hone|ad|od)/.test(window.navigator.userAgent) &&
        !(window.navigator as Navigator & { standalone?: boolean }).standalone
    );

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstallEvent(null);
      toast({
        title: "AdaptiFit installed",
        description: "You can now train and rehab fully offline.",
      });
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  // --- Online / offline banner ---------------------------------------------
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // --- Outbox sync feedback --------------------------------------------------
  useEffect(() => {
    if (pending > 0) {
      hadPendingRef.current = true;
      return;
    }
    // pending === 0: if we previously had queued writes, the flush succeeded.
    if (hadPendingRef.current) {
      hadPendingRef.current = false;
      toast({
        title: "Back in sync",
        description: "Your offline logs were saved to AdaptiFit.",
      });
    }
  }, [pending]);

  const handleInstall = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setInstallEvent(null);
      }
    } catch {
      // User closed the native prompt — keep our card available.
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore storage failures; card just reappears next session.
    }
  };

  const showInstallCard = (installEvent !== null || isIos) && !dismissed;

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-50 flex min-h-11 items-center justify-center gap-2 border-b border-warning/40 bg-warning-soft px-4 py-2 text-sm font-medium text-foreground"
        >
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            You are offline — AdaptiFit keeps working.
            {pending > 0
              ? ` ${pending} change${pending === 1 ? "" : "s"} will sync when you are back online.`
              : " Changes will sync when you are back online."}
          </span>
        </div>
      )}

      {/* Pending-sync indicator while back online but still replaying */}
      {isOnline && pending > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="glass-overlay fixed bottom-6 left-6 z-50 flex min-h-11 items-center gap-2 rounded-[18px] px-4 py-2.5 text-sm text-foreground"
        >
          <span
            className={`h-2 w-2 rounded-full bg-warning ${reduced ? "" : "animate-pulse"}`}
            aria-hidden="true"
          />
          Syncing {pending} offline change{pending === 1 ? "" : "s"}…
          <button
            type="button"
            onClick={() => void flush()}
            className="ml-1 min-h-11 px-2 font-medium text-primary underline underline-offset-2 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Retry now
          </button>
        </div>
      )}

      {/* Install card — bottom-left so it never covers the AI-chat / a11y
          FAB column on the right (UX-11). */}
      {showInstallCard && (
        <div
          role="status"
          aria-live="polite"
          className="glass-overlay fixed bottom-6 left-6 z-50 w-[calc(100vw-3rem)] max-w-[380px] rounded-[24px] p-4 text-foreground"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Download className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold">Install AdaptiFit</p>
              <p className="mt-0.5 text-sm text-foreground-muted">
                {isIos && installEvent === null
                  ? "Install AdaptiFit: tap Share → Add to Home Screen."
                  : "Works offline — workouts, Live Coach and Mind Gym stay available without internet."}
              </p>
              <div className="mt-3 flex gap-2">
                {isIos && installEvent === null ? (
                  <Button size="sm" onClick={handleDismiss} className="btn-aurora-primary h-11 rounded-[14px] px-4">
                    Got it
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => void handleInstall()} className="btn-aurora-primary h-11 rounded-[14px] px-4">
                    Install
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-11 rounded-[14px]">
                  Not now
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="-m-1 shrink-0 rounded-md p-2 text-foreground-muted opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

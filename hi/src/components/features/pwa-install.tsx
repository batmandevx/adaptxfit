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
          className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 shadow-md"
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
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-card-foreground shadow-lg"
        >
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-amber-500"
            aria-hidden="true"
          />
          Syncing {pending} offline change{pending === 1 ? "" : "s"}…
          <button
            type="button"
            onClick={() => void flush()}
            className="ml-1 underline underline-offset-2 hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          className="fixed bottom-4 left-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-lg border bg-card p-4 text-card-foreground shadow-xl"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Download className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Install AdaptiFit</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isIos && installEvent === null
                  ? "Install AdaptiFit: tap Share → Add to Home Screen."
                  : "Works offline — workouts, Live Coach and Mind Gym stay available without internet."}
              </p>
              <div className="mt-3 flex gap-2">
                {isIos && installEvent === null ? (
                  <Button size="sm" onClick={handleDismiss}>
                    Got it
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => void handleInstall()}>
                    Install
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Not now
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="shrink-0 rounded-sm p-2 -m-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

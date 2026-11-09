"use client";

/**
 * React binding for the offline outbox (./outbox.ts).
 *
 * - Exposes the live pending count.
 * - Flushes the queue automatically on the browser 'online' event and on
 *   service-worker messages of type "OUTBOX_FLUSH".
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  flushOutbox,
  getPendingCount,
  subscribe,
  type FlushResult,
} from "./outbox";

export interface UseOutboxResult {
  /** Number of queued writes waiting to sync. */
  pending: number;
  /** Manually trigger a replay; resolves with per-entry results. */
  flush: () => Promise<FlushResult>;
}

const subscribeClient = (onStoreChange: () => void) => subscribe(onStoreChange);
const getSnapshot = () => getPendingCount();
const getServerSnapshot = () => 0;

export function useOutbox(): UseOutboxResult {
  const pending = useSyncExternalStore(
    subscribeClient,
    getSnapshot,
    getServerSnapshot
  );

  const flush = useCallback(() => flushOutbox(), []);

  useEffect(() => {
    const onOnline = () => {
      void flushOutbox();
    };
    const onSwMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string } | undefined;
      if (data && data.type === "OUTBOX_FLUSH") {
        void flushOutbox();
      }
    };

    window.addEventListener("online", onOnline);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onSwMessage);
    }
    return () => {
      window.removeEventListener("online", onOnline);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onSwMessage);
      }
    };
  }, []);

  return { pending, flush };
}

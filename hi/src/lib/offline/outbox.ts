/**
 * AdaptiFit v2 — offline write outbox (framework-agnostic, no React imports).
 *
 * When a mutating request to /api/* fails because the device is offline, the
 * caller queues it here. The queue is persisted in localStorage and replayed
 * in FIFO order by flushOutbox(), which is triggered by:
 *   - the browser 'online' event, and
 *   - service-worker 'message' events ({ type: "OUTBOX_FLUSH" })
 * (both are wired up in the React hook in ./use-outbox.ts).
 *
 * The service worker (public/sw.js) answers failed POST/PATCH/PUT/DELETE to
 * /api/* with `503 {"offline":true}`; feature code should catch that and call
 * queueRequest(url, options) so the write syncs when back online.
 */

export interface QueuedRequest {
  /** Unique id (crypto.randomUUID when available). */
  id: string;
  /** Request URL, e.g. "/api/mood". */
  url: string;
  /** HTTP method (POST, PATCH, PUT, DELETE...). */
  method: string;
  /** Headers to replay (content-type etc.). */
  headers: Record<string, string>;
  /** Serialized body (string only — JSON bodies are the supported case). */
  body: string | null;
  /** Epoch ms when the request was queued. */
  queuedAt: number;
}

export interface FlushResult {
  /** Requests replayed successfully. */
  flushed: number;
  /** Requests that failed permanently (4xx) and were dropped. */
  dropped: number;
  /** Requests still pending after the flush attempt. */
  remaining: number;
}

const STORAGE_KEY = "adaptifit:outbox:v1";

type Listener = (pending: number) => void;
const listeners = new Set<Listener>();

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readQueue(): QueuedRequest[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedRequest[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedRequest[]): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full / unavailable — keep the in-memory flow working.
  }
  notify();
}

function notify(): void {
  const pending = readQueue().length;
  listeners.forEach((listener) => {
    try {
      listener(pending);
    } catch {
      // Listener errors must never break the outbox.
    }
  });
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Queue a mutating request for later replay. Returns the queued entry.
 * Bodies are serialized with JSON.stringify when given an object.
 */
export function queueRequest(url: string, options: RequestInit = {}): QueuedRequest {
  const headers: Record<string, string> = {};
  const initHeaders = options.headers;
  if (initHeaders) {
    if (initHeaders instanceof Headers) {
      initHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(initHeaders)) {
      initHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, initHeaders);
    }
  }

  let body: string | null = null;
  if (options.body != null) {
    body =
      typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    if (!headers["content-type"] && !headers["Content-Type"]) {
      headers["content-type"] = "application/json";
    }
  }

  const entry: QueuedRequest = {
    id: makeId(),
    url,
    method: (options.method ?? "POST").toUpperCase(),
    headers,
    body,
    queuedAt: Date.now(),
  };

  writeQueue([...readQueue(), entry]);
  return entry;
}

/** Number of queued requests waiting to be replayed. */
export function getPendingCount(): number {
  return readQueue().length;
}

/** Full snapshot of the pending queue (read-only use). */
export function getOutbox(): QueuedRequest[] {
  return readQueue();
}

/** Subscribe to pending-count changes. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Replay queued requests in FIFO order.
 * - Stops at the first network-level failure (still offline): the entry and
 *   everything after it stay queued.
 * - Drops entries that the server rejects with a 4xx (permanent failure).
 * - Safe to call concurrently: a second call while one is running is a no-op
 *   returning the current counts.
 */
let flushing = false;

export async function flushOutbox(
  fetchImpl: typeof fetch = fetch
): Promise<FlushResult> {
  if (flushing) {
    const remaining = getPendingCount();
    return { flushed: 0, dropped: 0, remaining };
  }
  flushing = true;
  let flushed = 0;
  let dropped = 0;
  try {
    let queue = readQueue();
    while (queue.length > 0) {
      const entry = queue[0];
      try {
        const response = await fetchImpl(entry.url, {
          method: entry.method,
          headers: entry.headers,
          body: entry.body,
          credentials: "same-origin",
        });
        if (response.status === 503) {
          // Still offline (SW offline stub) — stop and keep everything queued.
          break;
        }
        if (response.status >= 400 && response.status < 500) {
          // Permanent rejection — drop so the queue never deadlocks.
          dropped += 1;
        } else {
          flushed += 1;
        }
      } catch {
        // Network error — still offline; keep queue intact.
        break;
      }
      queue = queue.slice(1);
      writeQueue(queue);
    }
  } finally {
    flushing = false;
    notify();
  }
  return { flushed, dropped, remaining: getPendingCount() };
}

/** Remove everything (mainly for tests / account reset). */
export function clearOutbox(): void {
  writeQueue([]);
}

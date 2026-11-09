"use client";

/**
 * Service worker registration for AdaptiFit v2 (Offline-First PWA pillar).
 *
 * `registerServiceWorker()` performs the actual registration; the default
 * export is a tiny client component (`<SwRegister />`) that the root layout
 * renders once — it returns null and only runs effects, so it lives happily
 * in a .ts module without JSX.
 */

import { useEffect } from "react";

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // If a new worker is already waiting, activate it on next load; when a
        // new one is found later, ask it to take over once installed.
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content available — the worker will take control on the
              // next navigation (skipWaiting is already called on install).
            }
          });
        });
      })
      .catch((error) => {
        // Registration failures must never break the app.
        console.warn("[AdaptiFit] Service worker registration failed:", error);
      });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

export default function SwRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}

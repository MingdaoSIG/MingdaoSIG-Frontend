"use client";

import { useCallback, useSyncExternalStore } from "react";

// The Android / desktop install prompt (`beforeinstallprompt`). The browser
// fires it once, early; it is kept here (and its mini-infobar suppressed)
// until the user presses an install button in the notification settings or
// on /notifications. It never pops up by itself.
//
// app/layout.tsx captures an event fired before this module loads into
// `window.__mdsigInstallPrompt`.

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type EarlyWindow = Window & {
  __mdsigInstallPrompt?: BeforeInstallPromptEvent | null;
};

let deferred: BeforeInstallPromptEvent | null = null;
let started = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

/** Starts listening; called once from <PwaSetup>. */
export function captureInstallPrompt() {
  if (started || typeof window === "undefined") {
    return;
  }
  started = true;
  const early = (window as EarlyWindow).__mdsigInstallPrompt;
  if (early) {
    deferred = early;
    (window as EarlyWindow).__mdsigInstallPrompt = null;
    emit();
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useInstallPrompt() {
  const available = useSyncExternalStore(
    subscribe,
    () => deferred !== null,
    () => false,
  );

  /** Shows the browser's install dialog; the event can be used once. */
  const install = useCallback(async () => {
    const event = deferred;
    if (!event) {
      return "unavailable" as const;
    }
    deferred = null;
    emit();
    try {
      await event.prompt();
      const choice = await event.userChoice;
      return choice.outcome;
    } catch {
      return "unavailable" as const;
    }
  }, []);

  return { available, install };
}

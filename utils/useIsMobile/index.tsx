"use client";

import { useSyncExternalStore } from "react";

// Desktop and mobile are separate component trees. Reading the width
// synchronously (instead of starting at `false` and correcting in an
// effect) means a component mounted on the client renders the right tree
// first, so a phone never mounts the desktop tree and fetches twice.
// The server cannot know the width; <Device> waits for hydration before
// rendering pages (see useHydrated), so pages never hydrate a guess.

const BREAKPOINT = 1024;

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/** The hook's test, for code that runs outside render (handlers, effects). */
export function isMobileViewport() {
  return window.innerWidth < BREAKPOINT;
}

function getSnapshot() {
  return isMobileViewport();
}

function getServerSnapshot() {
  return false;
}

const useIsMobile = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export default useIsMobile;

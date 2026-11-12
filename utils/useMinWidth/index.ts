"use client";

import { useSyncExternalStore } from "react";

// Desktop column breakpoints (owner pick 1B, 2026-11-13): from 1280px a
// page gets one side column, from 1600px one on each side. Side columns
// are rendered only when they show, so their data is not fetched on
// narrower screens.

export const ONE_SIDE_MIN = 1280;
export const TWO_SIDES_MIN = 1600;

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/** True while the window is at least `px` wide. */
export function useMinWidth(px: number): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.innerWidth >= px,
    () => false,
  );
}

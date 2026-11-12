"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {
    // Hydration happens once; nothing to unsubscribe from
  };
}

/** False on the server and during hydration, true on the client after. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

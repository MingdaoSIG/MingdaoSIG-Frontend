"use client";

import { useCallback, useMemo } from "react";
import type { Sig } from "@/interfaces/Sig";
import { resolveSigColor } from "@/modules/sigTheme";
import { useSigDirectory } from "@/utils/useAdminAccess";

/**
 * `colorOf(sig)` resolves a SIG's accent colour from the API (the SIG
 * object itself, then the shared `/sig/list` cache) with the old table as
 * the fallback. `fallback` is used when nobody knows the SIG.
 */
export function useSigColor() {
  const directory = useSigDirectory();
  const byId = useMemo(() => {
    const map = new Map<string, Sig>();
    for (const sig of directory.data ?? []) {
      map.set(sig._id, sig);
    }
    return map;
  }, [directory.data]);

  return useCallback(
    (
      sig: { _id?: string; color?: string } | string | null | undefined,
      fallback?: string,
    ) => resolveSigColor(sig, byId) ?? fallback,
    [byId],
  );
}

/** SIG name → colour, for data that names SIGs (the dashboard charts). */
export function useSigColorByName() {
  const directory = useSigDirectory();
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const sig of directory.data ?? []) {
      const color = resolveSigColor(sig);
      if (color) {
        map.set(sig.name, color);
      }
    }
    return map;
  }, [directory.data]);
}

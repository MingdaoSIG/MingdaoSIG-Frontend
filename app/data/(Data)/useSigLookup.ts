"use client";

import { useState } from "react";

import type { Sig } from "@/interfaces/Sig";
import { apiRequest } from "@/modules/api/client";

const NOT_FOUND = "查無此 SIG";

/**
 * The SIG lookup of /data, shared by desktop and mobile. Accepts "@mdcsl"
 * (custom id) or a raw SIG id; anything else is looked up as typed and
 * simply comes back "not found".
 */
export function useSigLookup() {
  // null: nothing searched yet; 0: searched, no SIG.
  const [sigData, setSigData] = useState<Sig | 0 | null>(null);
  const [message, setMessage] = useState(NOT_FOUND);
  const [searching, setSearching] = useState(false);

  async function lookup(raw: string) {
    const query = raw.trim();
    if (!query || searching) {
      return;
    }
    setSearching(true);
    const result = await apiRequest<Sig>(
      `/sig/${encodeURIComponent(query).replace(/^%40/, "@")}`,
    );
    setSearching(false);
    if (result.ok && typeof result.data?._id === "string") {
      setSigData(result.data);
      return;
    }
    // Any answer without a SIG (a non-2000 status, a malformed id…) means
    // there is no such SIG; only real failures say what went wrong.
    setMessage(
      result.ok ||
        result.kind === "not-found" ||
        result.kind === "error" ||
        result.kind === "unauthorized"
        ? NOT_FOUND
        : result.message,
    );
    setSigData(0);
  }

  return { sigData, message, searching, lookup };
}

export function countOf(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

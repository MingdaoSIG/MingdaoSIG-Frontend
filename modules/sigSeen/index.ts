"use client";

import { useCallback, useSyncExternalStore } from "react";
import { storageGet, storageSet } from "@/utils/safeStorage";

// When this browser last looked at each SIG (contract v4 §6.5): the side
// rail shows a dot on a SIG whose `latestPostAt` is newer. One
// localStorage entry per account, `{ [sigId]: epoch ms }`. A SIG the rail
// has never seen starts "seen now" (see `useSigSeen().baseline`), so the
// first visit does not light up every SIG.

const PREFIX = "mdsig-sig-seen:";
const EVENT = "mdsig:sig-seen";

export type SigSeenMap = Record<string, number>;

const EMPTY: SigSeenMap = {};
let cache: { key: string; raw: string | null; map: SigSeenMap } | null = null;

function keyOf(userId: string) {
  return `${PREFIX}${userId || "guest"}`;
}

function parse(raw: string | null): SigSeenMap {
  if (!raw) {
    return EMPTY;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return EMPTY;
    }
    const map: SigSeenMap = {};
    for (const [id, at] of Object.entries(value)) {
      if (typeof at === "number" && Number.isFinite(at)) {
        map[id] = at;
      }
    }
    return map;
  } catch {
    return EMPTY;
  }
}

/** The stored map; the same object until the stored value changes. */
export function readSigSeen(userId: string): SigSeenMap {
  const key = keyOf(userId);
  const raw = storageGet(key);
  if (cache && cache.key === key && cache.raw === raw) {
    return cache.map;
  }
  const map = parse(raw);
  cache = { key, raw, map };
  return map;
}

function write(userId: string, patch: SigSeenMap) {
  const next = { ...readSigSeen(userId), ...patch };
  storageSet(keyOf(userId), JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

/** Records a visit to a SIG page. */
export function markSigSeen(userId: string, sigId: string, at = Date.now()) {
  if (!sigId) {
    return;
  }
  write(userId, { [sigId]: at });
}

/** True when the SIG has a post newer than the last visit. */
export function hasNewPosts(
  seen: SigSeenMap,
  sig: { _id: string; latestPostAt?: string | null },
) {
  const last = seen[sig._id];
  if (last === undefined || !sig.latestPostAt) {
    return false;
  }
  const latest = new Date(sig.latestPostAt).getTime();
  return Number.isFinite(latest) && latest > last;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  // Other tabs.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The last-seen map of an account, kept in step across tabs. */
export function useSigSeen(userId: string) {
  const seen = useSyncExternalStore(
    subscribe,
    () => readSigSeen(userId),
    () => EMPTY,
  );
  /** Starts the SIGs that have no entry yet at "now". */
  const baseline = useCallback(
    (sigIds: string[]) => {
      const current = readSigSeen(userId);
      const patch: SigSeenMap = {};
      for (const id of sigIds) {
        if (current[id] === undefined) {
          patch[id] = Date.now();
        }
      }
      if (Object.keys(patch).length > 0) {
        write(userId, patch);
      }
    },
    [userId],
  );
  return { seen, baseline };
}

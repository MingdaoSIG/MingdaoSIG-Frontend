"use client";

import { useCallback, useState } from "react";
import { sessionGet, sessionSet } from "@/utils/safeStorage";
import { useUserAccount } from "@/utils/useUserAccount";

/** The home tabs (decision 3A): 最新 / 熱門 / 我的 SIG. */
export type HomeFeed = "mysig" | "latest" | "top";

const FEED_KEY = "mdsig-home-feed";
const SIG_KEY = "mdsig-home-sig";

function savedFeed(): HomeFeed | null {
  const saved = sessionGet(FEED_KEY);
  return saved === "top" || saved === "mysig" || saved === "latest"
    ? saved
    : null;
}

/**
 * The selected home tab and SIG chip. A choice survives opening a post
 * and coming back (this browser tab only). Without one, everyone starts on
 * 最新 (owner, 2026-11-15: starting on 「我的 SIG」 showed the same posts on
 * every visit). 「我的 SIG」 falls back to 最新 when logged out.
 */
export function useHomeFeed() {
  const { isLogin, isLoading } = useUserAccount();
  const [chosen, setChosen] = useState<HomeFeed | null>(savedFeed);
  const [sigId, setSigState] = useState<string>(
    () => sessionGet(SIG_KEY) ?? "",
  );

  const setFeed = useCallback((next: HomeFeed) => {
    setChosen(next);
    sessionSet(FEED_KEY, next);
    // A SIG picked on one tab may not be offered on the next.
    setSigState("");
    sessionSet(SIG_KEY, "");
  }, []);

  const setSig = useCallback((next: string) => {
    setSigState(next);
    sessionSet(SIG_KEY, next);
  }, []);

  /** The login or the SIG list is not known yet: no default to pick. */
  // Kept for callers: the default no longer waits for the SIG list.
  const deciding = false;
  let feed: HomeFeed = chosen ?? "latest";
  if (feed === "mysig" && !isLogin && !isLoading) {
    feed = "latest";
  }
  return {
    feed,
    setFeed,
    sigId,
    setSig,
    deciding,
    /** Whether the 「我的 SIG」 tab is offered. */
    showMySig: isLogin,
  };
}

"use client";

import { useCallback, useState } from "react";
import { sessionGet, sessionSet } from "@/utils/safeStorage";
import { useUserAccount } from "@/utils/useUserAccount";

/** The home tabs: 最新 / 熱門 / 我的 SIG (logged in only). */
export type HomeFeed = "latest" | "top" | "mysig";

const FEED_KEY = "mdsig-home-feed";

function savedFeed(): HomeFeed {
  const saved = sessionGet(FEED_KEY);
  return saved === "top" || saved === "mysig" ? saved : "latest";
}

/**
 * The selected home tab. It survives opening a post and coming back (for
 * this browser tab only). 「我的 SIG」 falls back to 最新 when logged out.
 */
export function useHomeFeed() {
  const { isLogin, isLoading } = useUserAccount();
  const [feed, setFeedState] = useState<HomeFeed>(savedFeed);

  const setFeed = useCallback((next: HomeFeed) => {
    setFeedState(next);
    sessionSet(FEED_KEY, next);
  }, []);

  const showMySig = isLogin || isLoading;
  return {
    feed: feed === "mysig" && !showMySig ? "latest" : feed,
    setFeed,
    /** Whether the 「我的 SIG」 tab is offered. */
    showMySig: isLogin,
  };
}

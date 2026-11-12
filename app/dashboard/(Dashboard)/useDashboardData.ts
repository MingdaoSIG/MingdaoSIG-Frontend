"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/modules/api/client";
import {
  sigDefaultBorderColors,
  sigDefaultColors,
} from "./config/sigDefaultColors";

type SigCountItem = {
  name: string;
  count: number;
};

export type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
};

/** null: not loaded (yet). Shown as 「—」, never as a misleading 0. */
export type DashboardStats = {
  users: number | null;
  likes: number | null;
  posters: number | null;
  posts: number | null;
};

const NO_STATS: DashboardStats = {
  users: null,
  likes: null,
  posters: null,
  posts: null,
};

function toChart(items: SigCountItem[]): ChartData {
  return {
    labels: items.map((item) => item.name),
    datasets: [
      {
        data: items.map((item) => item.count),
        backgroundColor: items.map((item) => sigDefaultColors[item.name]),
        borderColor: items.map((item) => sigDefaultBorderColors[item.name]),
        borderWidth: 1,
      },
    ],
  };
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asSigCounts(value: unknown): SigCountItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is SigCountItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as SigCountItem).name === "string" &&
      typeof (item as SigCountItem).count === "number",
  );
}

export const EMPTY_CHART = toChart([]);

/** 1234 → "1,234"; not loaded → "—". */
export function formatStat(value: number | null) {
  return value === null ? "—" : value.toLocaleString("zh-TW");
}

/**
 * Every dashboard figure, fetched once on mount with one Promise.all.
 * (The count effect used to depend on the counts themselves, so each
 * answer aborted and refetched the rest, and 0 showed for seconds.)
 */
export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>(NO_STATS);
  const [sigPosts, setSigPosts] = useState<ChartData>(EMPTY_CHART);
  const [sigUsers, setSigUsers] = useState<ChartData>(EMPTY_CHART);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // `attempt` re-runs the fetch when the user presses retry.
  useEffect(() => {
    const controller = new AbortController();
    const date = new Date().toISOString();
    const get = (path: string) =>
      apiRequest<{ content?: unknown }>(`/information/${path}`, {
        query: { date },
        signal: controller.signal,
      });

    (async () => {
      setLoading(true);
      setError(null);
      const results = await Promise.all([
        get("user"),
        get("like"),
        get("user/posted"),
        get("post"),
        get("post/sig"),
        get("user/sig"),
      ]);
      if (controller.signal.aborted) {
        return;
      }
      const [users, likes, posters, posts, postsBySig, usersBySig] =
        results.map((result) => (result.ok ? result.data?.content : null));
      setStats({
        users: asNumber(users),
        likes: asNumber(likes),
        posters: asNumber(posters),
        posts: asNumber(posts),
      });
      setSigPosts(toChart(asSigCounts(postsBySig)));
      setSigUsers(toChart(asSigCounts(usersBySig)));
      const failure = results.find((result) => !result.ok);
      setError(failure && !failure.ok ? failure.message : null);
      setLoading(false);
    })();

    return () => controller.abort();
  }, [attempt]);

  return {
    stats,
    sigPosts,
    sigUsers,
    loading,
    error,
    retry: () => setAttempt((n) => n + 1),
  };
}

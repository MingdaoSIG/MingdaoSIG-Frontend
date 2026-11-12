"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/modules/api/client";
import { withAlpha } from "@/modules/sigTheme";
import { useSigColorByName } from "@/modules/sigTheme/useSigColor";
import {
  sigDefaultBorderColors,
  sigDefaultColors,
} from "./sigDefaultColors";

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

/**
 * The figures name their SIGs, so colours are looked up by name: the
 * SIG's colour from the API (half transparent fill, solid border), else
 * the old tables.
 */
function toChart(
  items: SigCountItem[],
  colors: Map<string, string> = new Map(),
): ChartData {
  const fill = (name: string) => {
    const color = colors.get(name);
    return color ? withAlpha(color, 0.5) : sigDefaultColors[name];
  };
  return {
    labels: items.map((item) => item.name),
    datasets: [
      {
        data: items.map((item) => item.count),
        backgroundColor: items.map((item) => fill(item.name)),
        borderColor: items.map(
          (item) => colors.get(item.name) ?? sigDefaultBorderColors[item.name],
        ),
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
  const [postCounts, setPostCounts] = useState<SigCountItem[]>([]);
  const [userCounts, setUserCounts] = useState<SigCountItem[]>([]);
  const colors = useSigColorByName();
  const sigPosts = useMemo(
    () => toChart(postCounts, colors),
    [postCounts, colors],
  );
  const sigUsers = useMemo(
    () => toChart(userCounts, colors),
    [userCounts, colors],
  );
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
      setPostCounts(asSigCounts(postsBySig));
      setUserCounts(asSigCounts(usersBySig));
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

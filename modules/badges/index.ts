"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { badgeList } from "@/app/[userID]/(User)/config/badge";
import { apiRequest } from "@/modules/api/client";
import { imageUrl } from "@/modules/imageUrl";

// Badges are data now (contract v4 §5.9): `GET /badge/list` is the public
// list, `/admin/badges` manages it. The old config
// (app/[userID]/(User)/config/badge.ts) is the fallback while the list
// cannot be read, and fills in the icon of a seeded badge without one.

export type Badge = {
  /** `^[a-z0-9_.-]{1,30}$`, what users store in `badge[]`. */
  key: string;
  /** 1–20 characters. */
  name: string;
  /** Up to 100 characters. */
  description?: string;
  /** An image id from POST /image. */
  icon?: string;
  /** A path under public/ for the seeded badges. */
  iconPath?: string;
  /** `#rrggbb`. */
  color?: string;
  /** Retired: hidden, but users keep it. */
  removed?: boolean;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const BADGE_KEY_PATTERN = /^[a-z0-9_.-]{1,30}$/;
export const BADGE_NAME_MAX = 20;
export const BADGE_DESCRIPTION_MAX = 100;

export const BADGE_LIST_QUERY_KEY = ["badge-list"] as const;

type FallbackKey = keyof typeof badgeList;

/** The three badges of the old config, as API badges. */
export const FALLBACK_BADGES: Badge[] = (
  Object.keys(badgeList) as FallbackKey[]
).map((key) => ({
  key,
  name: badgeList[key].content,
  iconPath: badgeList[key].icon,
}));

function fallbackIcon(key: string) {
  return key in badgeList ? badgeList[key as FallbackKey].icon : undefined;
}

/** Where a badge's icon is: its upload, its seeded path, or the old one. */
export function badgeIconUrl(badge: Pick<Badge, "key" | "icon" | "iconPath">) {
  return (
    imageUrl(badge.icon) ?? imageUrl(badge.iconPath) ?? fallbackIcon(badge.key)
  );
}

export function isBadge(value: unknown): value is Badge {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Badge).key === "string" &&
    typeof (value as Badge).name === "string"
  );
}

/**
 * Every badge the site knows: from the API, or the old three when the
 * list cannot be read (`fallback: true`). `byKey` also finds retired
 * badges the API still lists.
 */
export function useBadges() {
  const query = useQuery({
    queryKey: BADGE_LIST_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const result = await apiRequest<unknown[]>("/badge/list", { signal });
      if (!result.ok || !Array.isArray(result.data)) {
        throw new Error(result.ok ? "invalid badge list" : result.message);
      }
      return result.data.filter(isBadge);
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const fallback = query.isError;
  const badges = query.data ?? (fallback ? FALLBACK_BADGES : []);
  const byKey = useMemo(() => {
    const map = new Map<string, Badge>();
    for (const badge of FALLBACK_BADGES) {
      map.set(badge.key, badge);
    }
    for (const badge of badges) {
      map.set(badge.key, badge);
    }
    return map;
  }, [badges]);
  return { badges, byKey, fallback, isPending: query.isPending };
}

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiError, apiRequest } from "@/modules/api/client";
import type { Suspension, SuspensionType } from "@/modules/suspension";
import { getData, getPage, send } from "./api";
import type { AuditEntry, UserRef, UserRole } from "./types";

// Moderation and communication (design/api-contract-v4.md §5.1–§5.5,
// §5.10, §5.11): roles, 停權／禁言, login log, site banners, broadcasts,
// traffic and the keyword filter. Reads are react-query hooks under the
// "admin" key, so invalidating adminKeys.all refreshes them too.

export const moderationKeys = {
  suspensionHistory: (id: string) =>
    ["admin", "users", "suspension-history", id] as const,
  userLogins: (id: string) => ["admin", "users", "logins", id] as const,
  logins: ["admin", "logins"] as const,
  banners: ["admin", "banners"] as const,
  traffic: ["admin", "traffic"] as const,
  keywordFilter: ["admin", "keyword-filter"] as const,
  broadcasts: ["admin", "audit", "broadcasts"] as const,
};

// ---- Roles (§5.2) -------------------------------------------------------

export const ROLE_LABEL: Record<UserRole, string> = {
  user: "一般使用者",
  moderator: "內容管理員",
  admin: "管理員",
};

/** The role a permission stands for (2 admin, 3 content moderator). */
export function roleOf(user: { role?: UserRole; permission?: number }) {
  if (user.role === "admin" || user.permission === 2) {
    return "admin";
  }
  if (user.role === "moderator" || user.permission === 3) {
    return "moderator";
  }
  return "user";
}

export function setUserRole(id: string, role: UserRole) {
  return send<{ permission?: number; role?: UserRole }>(
    `/admin/users/${id}/permission`,
    { body: { role } },
  );
}

// ---- Suspensions (§5.1) -------------------------------------------------

export function suspendUser(
  id: string,
  body: { type: SuspensionType; until: string | null; reason: string },
) {
  return send<{ suspension?: Suspension }>(`/admin/users/${id}/suspend`, {
    body,
  });
}

export function unsuspendUser(id: string) {
  return send(`/admin/users/${id}/unsuspend`);
}

/**
 * 停權／禁言 history from the audit log (admins only: the log is). The
 * log filters by target; the suspension entries are picked here.
 */
export function useSuspensionHistory(id: string, enabled: boolean) {
  return useQuery({
    queryKey: moderationKeys.suspensionHistory(id),
    queryFn: async ({ signal }) => {
      const page = await getPage<AuditEntry>(
        "/admin/audit",
        { targetKind: "user", targetId: id, skip: 0, limit: 100 },
        signal,
      );
      return page.items.filter(
        (entry) =>
          entry.action === "user.suspend" || entry.action === "user.unsuspend",
      );
    },
    enabled,
  });
}

// ---- Login log (§5.3) ---------------------------------------------------

export type LoginEntry = {
  _id: string;
  user: UserRef | null;
  method: "google" | "session" | string;
  /** sha256(ip + secret): equal hashes mean the same address. */
  ipHash?: string;
  userAgent?: string;
  createdAt?: string;
};

export const LOGIN_METHOD_LABEL: Record<string, string> = {
  google: "Google 登入",
  session: "校園 App",
};

export function useLogins(
  query: { skip: number; limit: number; user?: string },
  enabled: boolean = true,
) {
  const { user, ...page } = query;
  return useQuery({
    queryKey: [...moderationKeys.logins, query],
    queryFn: ({ signal }) =>
      getPage<LoginEntry>(
        user ? `/admin/users/${user}/logins` : "/admin/logins",
        page,
        signal,
      ),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** 「Chrome · macOS」 from a user agent; "" when it says nothing useful. */
export function describeUserAgent(agent: string | undefined) {
  if (!agent) {
    return "";
  }
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /OPR\/|Opera/.test(agent)
      ? "Opera"
      : /SamsungBrowser/.test(agent)
        ? "Samsung Internet"
        : /Firefox\/|FxiOS/.test(agent)
          ? "Firefox"
          : /Chrome\/|CriOS/.test(agent)
            ? "Chrome"
            : /Safari\//.test(agent)
              ? "Safari"
              : "";
  const system = /iPhone|iPad|iPod/.test(agent)
    ? "iOS"
    : /Android/.test(agent)
      ? "Android"
      : /Windows/.test(agent)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(agent)
          ? "macOS"
          : /CrOS/.test(agent)
            ? "ChromeOS"
            : /Linux/.test(agent)
              ? "Linux"
              : "";
  return [browser, system].filter(Boolean).join(" · ");
}

// ---- Site banners (§5.4) ------------------------------------------------

export type BannerLevel = "info" | "warning" | "success";

export type AdminBanner = {
  _id: string;
  message: string;
  link?: string;
  level: BannerLevel;
  startAt: string;
  endAt?: string | null;
  createdBy?: UserRef | string | null;
  removed?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BannerInput = {
  message: string;
  link: string;
  level: BannerLevel;
  startAt: string;
  endAt: string | null;
};

export function useBanners() {
  return useQuery({
    queryKey: moderationKeys.banners,
    queryFn: ({ signal }) =>
      getPage<AdminBanner>("/admin/banners", { skip: 0, limit: 100 }, signal),
  });
}

export function saveBanner(id: string | null, body: BannerInput) {
  return send<AdminBanner>(id ? `/admin/banners/${id}` : "/admin/banners", {
    body,
  });
}

export function deleteBanner(id: string) {
  return send(`/admin/banners/${id}`, { method: "DELETE" });
}

// ---- Broadcasts (§5.5) --------------------------------------------------

export type BroadcastAudience = { type: "all" } | { type: "sig"; sig: string };

export type BroadcastInput = {
  audience: BroadcastAudience;
  title: string;
  message: string;
  link?: string;
  push: boolean;
};

export const BROADCAST_TITLE_MAX = 60;
export const BROADCAST_MESSAGE_MAX = 300;
/** Broadcasts per sender per hour (contract v4 §5.5, 4290 above it). */
export const BROADCASTS_PER_HOUR = 5;

/**
 * How many people a broadcast would reach, without sending it. Asks the
 * backend (`dryRun: true`); null when it cannot say, and the caller
 * falls back to its own estimate.
 */
export async function countRecipients(input: BroadcastInput) {
  const result = await send<{ recipients?: number }>("/admin/broadcast", {
    body: { ...input, dryRun: true },
  });
  if (result.ok && typeof result.data?.recipients === "number") {
    return { ok: true as const, recipients: result.data.recipients };
  }
  return { ok: false as const, failure: result.ok ? null : result };
}

export function sendBroadcast(input: BroadcastInput) {
  return send<{ recipients?: number }>("/admin/broadcast", { body: input });
}

/** Earlier broadcasts, from the audit log (admins only). */
export function useRecentBroadcasts(enabled: boolean) {
  return useQuery({
    queryKey: moderationKeys.broadcasts,
    queryFn: ({ signal }) =>
      getPage<AuditEntry>(
        "/admin/audit",
        { action: "broadcast.send", skip: 0, limit: 10 },
        signal,
      ),
    enabled,
  });
}

// ---- Traffic (§5.10) ----------------------------------------------------

export type TrafficRange = "7d" | "30d" | "90d";

export type Traffic = {
  pageviews: number;
  visitors: number;
  visits: number;
  series: { date: string; pageviews: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  topReferrers: { referrer: string; visits: number }[];
};

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function list<T>(value: unknown, map: (item: Record<string, unknown>) => T) {
  return Array.isArray(value)
    ? value
        .filter((item) => item && typeof item === "object")
        .map((item) => map(item as Record<string, unknown>))
    : [];
}

function normalizeTraffic(raw: unknown): Traffic {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    pageviews: num(data.pageviews),
    visitors: num(data.visitors),
    visits: num(data.visits),
    series: list(data.series, (item) => ({
      date: String(item.date ?? ""),
      pageviews: num(item.pageviews),
      visitors: num(item.visitors),
    })).filter((item) => item.date),
    topPages: list(data.topPages, (item) => ({
      path: String(item.path ?? ""),
      views: num(item.views),
    })),
    topReferrers: list(data.topReferrers, (item) => ({
      referrer: String(item.referrer ?? ""),
      visits: num(item.visits),
    })),
  };
}

/**
 * Site traffic from Umami. `null` when the backend has no Umami set up
 * (503): the overview then shows no traffic card at all.
 */
export function useTraffic(range: TrafficRange, enabled: boolean) {
  return useQuery({
    queryKey: [...moderationKeys.traffic, range],
    queryFn: async ({ signal }) => {
      const result = await apiRequest<unknown>("/admin/traffic", {
        auth: true,
        query: { range },
        signal,
      });
      if (!result.ok) {
        if (result.httpStatus === 503) {
          return null;
        }
        throw new ApiError(result);
      }
      return normalizeTraffic(result.data);
    },
    placeholderData: keepPreviousData,
    // The backend caches for 10 minutes.
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

// ---- Keyword filter (§5.11) ---------------------------------------------

export const KEYWORD_MAX_WORDS = 200;
export const KEYWORD_MAX_LENGTH = 30;

export type KeywordFilter = {
  words: string[];
  updatedAt?: string | null;
  updatedBy?: string | UserRef | null;
};

export function useKeywordFilter() {
  return useQuery({
    queryKey: moderationKeys.keywordFilter,
    queryFn: async ({ signal }) => {
      const data = await getData<KeywordFilter>(
        "/admin/keyword-filter",
        undefined,
        signal,
      );
      return {
        ...data,
        words: Array.isArray(data.words)
          ? data.words.filter(
              (word): word is string => typeof word === "string" && word !== "",
            )
          : [],
      };
    },
  });
}

export function saveKeywordFilter(words: string[]) {
  return send<KeywordFilter>("/admin/keyword-filter", { body: { words } });
}

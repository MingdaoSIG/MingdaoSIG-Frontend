"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { TSigEvent } from "@/interfaces/Engagement";
import { ApiError, apiRequest } from "@/modules/api/client";
import { eventFailureMessage } from "@/modules/sigEvents";
import { useUserAccount } from "@/utils/useUserAccount";

// Events across SIGs (contract v4 §6.4, `GET /event/list`): the 活動
// page, 探索 and the home right column. Items carry the SIG as
// `{ _id, name, customId, color }`; they are stored here as plain
// TSigEvent (`sig` = id) with the SIG beside them, so `SigEventCard`
// renders them as they are.

export type EventScope = "all" | "mine" | "rsvped";

export type SiteEventSig = {
  _id: string;
  name: string;
  customId?: string;
  color?: string;
};

export type SiteEvent = { event: TSigEvent; sig: SiteEventSig };

export type SiteEventPage = { items: SiteEvent[]; total: number };

/** Root of every cross-SIG event query (patched by usePatchEvent). */
export const SITE_EVENTS_KEY = ["siteEvents"] as const;

function toSiteEvent(value: unknown): SiteEvent | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const raw = value as Omit<TSigEvent, "sig"> & { sig: unknown };
  if (typeof raw._id !== "string" || typeof raw.startAt !== "string") {
    return null;
  }
  const sig =
    typeof raw.sig === "object" && raw.sig !== null
      ? (raw.sig as SiteEventSig)
      : { _id: String(raw.sig ?? ""), name: "" };
  return { event: { ...raw, sig: sig._id } as TSigEvent, sig };
}

export async function fetchSiteEvents(
  query: {
    scope: EventScope;
    skip: number;
    limit: number;
    from?: string;
    to?: string;
  },
  signal?: AbortSignal,
): Promise<SiteEventPage> {
  const result = await apiRequest<unknown[]>("/event/list", {
    query,
    signal,
    auth: query.scope !== "all" || undefined,
  });
  if (!result.ok) {
    throw new ApiError({
      ...result,
      message: eventFailureMessage(result, "load"),
    });
  }
  const items = (Array.isArray(result.data) ? result.data : [])
    .map(toSiteEvent)
    .filter((item): item is SiteEvent => item !== null);
  const total =
    typeof result.body.total === "number" ? result.body.total : items.length;
  return { items, total };
}

/** The list: the next 60 days by default, sorted by start time. */
export function useSiteEvents(
  scope: EventScope,
  pageSize: number = 20,
  enabled: boolean = true,
) {
  const { userData, isLoading, isLogin } = useUserAccount();
  const viewer = userData?._id ?? "guest";
  return useInfiniteQuery<SiteEventPage, Error>({
    queryKey: [...SITE_EVENTS_KEY, "list", scope, pageSize, viewer],
    queryFn: ({ pageParam, signal }) =>
      fetchSiteEvents(
        { scope, skip: Number(pageParam) * pageSize, limit: pageSize },
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
      return last.items.length === pageSize && loaded < last.total
        ? pages.length
        : undefined;
    },
    // Wait for the login: `rsvpedByMe` depends on who asks, and the
    // signed-in scopes need it.
    enabled: enabled && !isLoading && (scope === "all" || isLogin),
    staleTime: 30 * 1000,
  });
}

/** The next few events (home right column, 探索). */
export function useUpcomingEvents(
  scope: EventScope,
  limit: number = 4,
  enabled: boolean = true,
) {
  const { userData, isLoading, isLogin } = useUserAccount();
  const viewer = userData?._id ?? "guest";
  return useQuery<SiteEventPage, Error>({
    queryKey: [...SITE_EVENTS_KEY, "upcoming", scope, limit, viewer],
    queryFn: ({ signal }) => fetchSiteEvents({ scope, skip: 0, limit }, signal),
    enabled: enabled && !isLoading && (scope === "all" || isLogin),
    staleTime: 60 * 1000,
  });
}

/** One month (or any window up to 120 days) for the calendar view. */
export function useEventWindow(
  scope: EventScope,
  from: Date,
  to: Date,
  enabled: boolean = true,
) {
  const { userData, isLoading, isLogin } = useUserAccount();
  const viewer = userData?._id ?? "guest";
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  return useQuery<SiteEventPage, Error>({
    queryKey: [...SITE_EVENTS_KEY, "window", scope, fromIso, toIso, viewer],
    queryFn: ({ signal }) =>
      fetchSiteEvents(
        { scope, skip: 0, limit: 100, from: fromIso, to: toIso },
        signal,
      ),
    enabled: enabled && !isLoading && (scope === "all" || isLogin),
    staleTime: 60 * 1000,
  });
}

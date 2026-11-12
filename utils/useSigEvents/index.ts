"use client";

import {
  type InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import type { TSigEvent } from "@/interfaces/Engagement";
import { ApiError } from "@/modules/api/client";
import {
  type EventPage,
  type EventWhen,
  eventFailureMessage,
  fetchSigEvents,
} from "@/modules/sigEvents";
import { useUserAccount } from "@/utils/useUserAccount";

// SIG event lists through react-query. The key includes the viewer, since
// `rsvpedByMe` depends on who asks; a write patches every cached list so
// the SIG page and the admin tab agree without refetching.

export const SIG_EVENTS_KEY = ["sigEvents"] as const;

export function sigEventsKey(sigId: string) {
  return [...SIG_EVENTS_KEY, sigId] as const;
}

export function useSigEvents(
  sigId: string,
  when: EventWhen,
  pageSize: number = 10,
  enabled: boolean = true,
) {
  const { userData, isLoading } = useUserAccount();
  const viewer = userData?._id ?? "guest";
  return useInfiniteQuery<EventPage, Error>({
    queryKey: [...sigEventsKey(sigId), when, pageSize, viewer],
    queryFn: async ({ pageParam, signal }) => {
      const result = await fetchSigEvents(
        sigId,
        { when, skip: Number(pageParam) * pageSize, limit: pageSize },
        signal,
      );
      if (!result.ok) {
        throw new ApiError({
          ...result,
          message: eventFailureMessage(result, "load"),
        });
      }
      return result.data;
    },
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
      return last.items.length === pageSize && loaded < last.total
        ? pages.length
        : undefined;
    },
    // Wait for the login check, or the first answer has no rsvpedByMe.
    enabled: enabled && Boolean(sigId) && !isLoading,
    staleTime: 30 * 1000,
  });
}

/** Writes the server's copy of an event into every cached list. */
export function usePatchEvent() {
  const queryClient = useQueryClient();
  return useCallback(
    (event: TSigEvent) => {
      queryClient.setQueriesData<InfiniteData<EventPage>>(
        { queryKey: sigEventsKey(event.sig) },
        (old) =>
          old?.pages
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  items: page.items.map((item) =>
                    item._id === event._id
                      ? {
                          ...event,
                          // Manager writes answer for the manager; keep
                          // the viewer's own RSVP flag when it is absent.
                          rsvpedByMe: event.rsvpedByMe ?? item.rsvpedByMe,
                        }
                      : item,
                  ),
                })),
              }
            : old,
      );
    },
    [queryClient],
  );
}

/** Refetches the SIG's event lists (after a create or a delete). */
export function useInvalidateEvents() {
  const queryClient = useQueryClient();
  return useCallback(
    (sigId: string) =>
      queryClient.invalidateQueries({ queryKey: sigEventsKey(sigId) }),
    [queryClient],
  );
}

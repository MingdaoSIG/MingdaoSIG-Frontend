"use client";

import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import type { TNotification } from "@/interfaces/Notification";
import { ApiError, type ApiResult, apiRequest } from "@/modules/api/client";
import { useUserAccount } from "@/utils/useUserAccount";

// The bell and /notifications (api-contract-v4 §2.1). Every query key
// carries the user id, so switching accounts never shows the previous
// account's notifications.

/** The unread count is polled this often while the tab is visible. */
export const UNREAD_POLL_MS = 60 * 1000;
export const NOTIFICATION_PAGE_SIZE = 30;
export const NOTIFICATION_PREVIEW_SIZE = 8;

export type NotificationFilter = "all" | "unread";

export type NotificationPage = {
  items: TNotification[];
  total: number;
  unread: number | null;
};

const ROOT_KEY = "notifications";

export const unreadKey = (userId: string) =>
  [ROOT_KEY, "unread", userId] as const;
const listKey = (userId: string, filter: NotificationFilter) =>
  [ROOT_KEY, "list", userId, filter] as const;
const previewKey = (userId: string) => [ROOT_KEY, "preview", userId] as const;

function isNotification(value: unknown): value is TNotification {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const item = value as TNotification;
  return typeof item._id === "string" && typeof item.type === "string";
}

function invalidResponse(result: ApiResult<unknown>) {
  return new ApiError({
    ok: false,
    kind: "invalid-response",
    status: result.status,
    httpStatus: result.httpStatus,
    message: "伺服器暫時無法回應，請稍後再試",
    body: result.body,
  });
}

async function fetchNotifications(
  query: { skip: number; limit: number; unread?: boolean },
  signal: AbortSignal,
): Promise<NotificationPage> {
  const result = await apiRequest<unknown>("/notification/list", {
    auth: true,
    signal,
    query: {
      skip: query.skip,
      limit: query.limit,
      unread: query.unread ? 1 : undefined,
    },
  });
  if (!result.ok) {
    throw new ApiError(result);
  }
  if (!Array.isArray(result.data)) {
    throw invalidResponse(result);
  }
  const items = result.data.filter(isNotification);
  const total = result.body.total;
  const unread = result.body.unread;
  return {
    items,
    total: typeof total === "number" ? total : items.length,
    unread: typeof unread === "number" && unread >= 0 ? unread : null,
  };
}

/**
 * Unread count for the bell: every 60 s while the tab is visible, when it
 * becomes visible again, and when the window gets focus.
 */
export function useUnreadCount() {
  const { isLogin, userData } = useUserAccount();
  const queryClient = useQueryClient();
  const userId = userData?._id ?? "";
  const enabled = isLogin && Boolean(userId);

  const query = useQuery<number, Error>({
    queryKey: unreadKey(userId),
    queryFn: async ({ signal }) => {
      const result = await apiRequest<{ unread?: unknown }>(
        "/notification/unread-count",
        { auth: true, signal },
      );
      if (!result.ok) {
        throw new ApiError(result);
      }
      const unread = result.data?.unread;
      return typeof unread === "number" && unread >= 0 ? unread : 0;
    },
    enabled,
    // react-query pauses the interval while the tab is hidden and
    // refetches when it becomes visible (if older than staleTime).
    refetchInterval: UNREAD_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 1000,
    retry: false,
  });

  // react-query only listens to visibilitychange. Coming back from another
  // window while the tab stayed visible fires `focus` alone.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const key = unreadKey(userId);
    const onFocus = () => {
      const state = queryClient.getQueryState(key);
      if (state?.fetchStatus === "fetching") {
        return;
      }
      if (Date.now() - (state?.dataUpdatedAt ?? 0) < 5 * 1000) {
        return;
      }
      void queryClient.refetchQueries({ queryKey: key, exact: true });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, userId, queryClient]);

  return { unread: enabled ? (query.data ?? 0) : 0, query };
}

/** Keeps the bell in step with the `unread` every list page carries. */
function syncUnread(queryClient: QueryClient, userId: string, page: unknown) {
  const unread = (page as NotificationPage | undefined)?.unread;
  if (typeof unread === "number") {
    queryClient.setQueryData(unreadKey(userId), unread);
  }
}

/** /notifications: every notification (or only unread), 30 per page. */
export function useNotificationList(filter: NotificationFilter) {
  const { isLogin, userData } = useUserAccount();
  const queryClient = useQueryClient();
  const userId = userData?._id ?? "";

  return useInfiniteQuery<NotificationPage, Error>({
    queryKey: listKey(userId, filter),
    queryFn: async ({ pageParam, signal }) => {
      const page = await fetchNotifications(
        {
          skip: Number(pageParam) * NOTIFICATION_PAGE_SIZE,
          limit: NOTIFICATION_PAGE_SIZE,
          unread: filter === "unread",
        },
        signal,
      );
      syncUnread(queryClient, userId, page);
      return page;
    },
    enabled: isLogin && Boolean(userId),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, page) => n + page.items.length, 0);
      if (lastPage.items.length === 0 || loaded >= lastPage.total) {
        return undefined;
      }
      return allPages.length;
    },
    staleTime: 0,
  });
}

/** The bell dropdown: the newest few, loaded when it opens. */
export function useNotificationPreview(open: boolean) {
  const { isLogin, userData } = useUserAccount();
  const queryClient = useQueryClient();
  const userId = userData?._id ?? "";

  return useQuery<NotificationPage, Error>({
    queryKey: previewKey(userId),
    queryFn: async ({ signal }) => {
      const page = await fetchNotifications(
        { skip: 0, limit: NOTIFICATION_PREVIEW_SIZE },
        signal,
      );
      syncUnread(queryClient, userId, page);
      return page;
    },
    enabled: open && isLogin && Boolean(userId),
    staleTime: 0,
  });
}

function markItems(
  items: TNotification[],
  ids: Set<string> | "all",
): TNotification[] {
  return items.map((item) =>
    !item.read && (ids === "all" || ids.has(item._id))
      ? { ...item, read: true }
      : item,
  );
}

/**
 * Marks notifications read: shows it at once, then asks the backend. On
 * failure the lists and the count are reloaded from the backend.
 */
export function useMarkRead() {
  const { userData } = useUserAccount();
  const queryClient = useQueryClient();
  const userId = userData?._id ?? "";

  return useCallback(
    async (target: TNotification[] | "all") => {
      const ids =
        target === "all" ? "all" : new Set(target.map((item) => item._id));
      const newlyRead =
        target === "all" ? 0 : target.filter((item) => !item.read).length;

      for (const filter of ["all", "unread"] as const) {
        queryClient.setQueryData<InfiniteData<NotificationPage>>(
          listKey(userId, filter),
          (data) =>
            data && {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: markItems(page.items, ids),
              })),
            },
        );
      }
      queryClient.setQueryData<NotificationPage>(
        previewKey(userId),
        (page) => page && { ...page, items: markItems(page.items, ids) },
      );
      queryClient.setQueryData<number>(unreadKey(userId), (unread) =>
        ids === "all" ? 0 : Math.max(0, (unread ?? 0) - newlyRead),
      );

      const result = await apiRequest<{ updated?: number }>(
        "/notification/read",
        {
          method: "POST",
          auth: true,
          body: target === "all" ? { all: true } : { ids: [...ids] },
        },
      );
      if (!result.ok) {
        void queryClient.invalidateQueries({ queryKey: [ROOT_KEY] });
      }
      return result;
    },
    [queryClient, userId],
  );
}

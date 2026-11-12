"use client";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { ApiError, type ApiResult, apiRequest } from "@/modules/api/client";
import { useUserAccount } from "@/utils/useUserAccount";

// Bookmarks (contract v4 §4.3). One `GET /user/me/bookmarks/ids` fills
// every bookmark icon on the page; toggling updates that cache at once and
// rolls back if the backend refuses.

export const bookmarkKeys = {
  ids: (userId: string) => ["bookmarks", userId, "ids"] as const,
  list: (userId: string) => ["bookmarks", userId, "list"] as const,
};

function isIdList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

async function fetchBookmarkIds(signal: AbortSignal): Promise<string[]> {
  const result = await apiRequest<unknown>("/user/me/bookmarks/ids", {
    auth: true,
    signal,
  });
  if (!result.ok) {
    throw new ApiError(result);
  }
  return isIdList(result.data) ? result.data : [];
}

function setIds(
  client: QueryClient,
  userId: string,
  update: (ids: string[]) => string[],
) {
  client.setQueryData<string[]>(bookmarkKeys.ids(userId), (old) =>
    update(old ?? []),
  );
}

export function useBookmarks() {
  const { isLogin, userData } = useUserAccount();
  const userId = isLogin ? (userData?._id ?? "") : "";
  const client = useQueryClient();

  const query = useQuery({
    queryKey: bookmarkKeys.ids(userId),
    queryFn: ({ signal }) => fetchBookmarkIds(signal),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const saved = useMemo(() => new Set(query.data ?? []), [query.data]);

  /** Adds or removes the bookmark; resolves with the backend's answer. */
  const toggle = useCallback(
    async (
      postId: string,
    ): Promise<ApiResult<unknown> & { added: boolean }> => {
      const current = client.getQueryData<string[]>(bookmarkKeys.ids(userId));
      const add = !(current ?? []).includes(postId);
      setIds(client, userId, (ids) =>
        add ? [postId, ...ids] : ids.filter((id) => id !== postId),
      );
      const result = await apiRequest(`/post/${postId}/bookmark`, {
        method: add ? "POST" : "DELETE",
        auth: true,
      });
      if (!result.ok) {
        setIds(client, userId, (ids) =>
          add ? ids.filter((id) => id !== postId) : [postId, ...ids],
        );
      } else {
        void client.invalidateQueries({ queryKey: bookmarkKeys.list(userId) });
      }
      return { ...result, added: add };
    },
    [client, userId],
  );

  return {
    enabled: Boolean(userId),
    isBookmarked: (postId: string | undefined) =>
      Boolean(postId) && saved.has(postId ?? ""),
    toggle,
  };
}

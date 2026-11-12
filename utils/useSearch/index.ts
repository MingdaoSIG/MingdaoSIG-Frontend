"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
import { ApiError, apiRequest } from "@/modules/api/client";

// Unified search (contract v4 §6.3): `GET /search` answers every section
// at once (at most `limit` each, 20 at most); paging per type uses
// `/post/search` (InfiniteThreadList) and `GET /search/users`.

export type SearchSig = {
  _id: string;
  name: string;
  customId?: string;
  color?: string;
  avatar?: string;
  memberCount?: number;
  recruiting?: { open?: boolean; until?: string | null; message?: string };
};

export type SearchTag = { tag: string; count: number };

export type SearchUser = Pick<
  User,
  "_id" | "name" | "customId" | "avatar" | "description"
>;

export type UnifiedSearch = {
  posts: { data: TThread[]; total: number };
  sigs: SearchSig[];
  tags: SearchTag[];
  users: SearchUser[];
};

const arrayOf = <T>(value: unknown, keep: (item: T) => boolean): T[] =>
  Array.isArray(value)
    ? (value as T[]).filter((item) => item && keep(item))
    : [];

function toUnified(value: unknown): UnifiedSearch {
  const data = (value ?? {}) as Record<string, unknown>;
  const posts = (data.posts ?? {}) as { data?: unknown; total?: unknown };
  const postList = arrayOf<TThread>(
    posts.data,
    (post) => typeof post._id === "string",
  );
  return {
    posts: {
      data: postList,
      total: typeof posts.total === "number" ? posts.total : postList.length,
    },
    sigs: arrayOf<SearchSig>(
      data.sigs,
      (sig) => typeof sig._id === "string" && typeof sig.name === "string",
    ),
    tags: arrayOf<SearchTag>(
      data.tags,
      (tag) => typeof tag.tag === "string" && tag.tag.trim() !== "",
    ).map((tag) => ({
      tag: tag.tag.replace(/^#+/, "").trim(),
      count: typeof tag.count === "number" ? tag.count : 0,
    })),
    users: arrayOf<SearchUser>(
      data.users,
      (item) => typeof item._id === "string",
    ),
  };
}

/** Every section of the results for `q`, `limit` each (1–20). */
export function useUnifiedSearch(q: string, limit: number = 5) {
  return useQuery<UnifiedSearch, Error>({
    queryKey: ["unifiedSearch", q, limit],
    queryFn: async ({ signal }) => {
      const result = await apiRequest<unknown>("/search", {
        query: { q, limit },
        signal,
      });
      if (!result.ok) {
        throw new ApiError(result);
      }
      return toUnified(result.data);
    },
    enabled: q.length > 0,
    staleTime: 60 * 1000,
  });
}

export const USER_SEARCH_PAGE = 20;

type UserPage = { items: SearchUser[]; total: number };

/** 使用者 tab: every matching user, 20 at a time. */
export function useUserSearch(q: string, enabled: boolean = true) {
  return useInfiniteQuery<UserPage, Error>({
    queryKey: ["userSearch", q],
    queryFn: async ({ pageParam, signal }) => {
      const result = await apiRequest<unknown>("/search/users", {
        query: {
          q,
          skip: Number(pageParam) * USER_SEARCH_PAGE,
          limit: USER_SEARCH_PAGE,
        },
        signal,
      });
      if (!result.ok) {
        throw new ApiError(result);
      }
      const items = arrayOf<SearchUser>(
        result.data,
        (item) => typeof item._id === "string",
      );
      const total =
        typeof result.body.total === "number"
          ? result.body.total
          : items.length;
      return { items, total };
    },
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
      return last.items.length > 0 && loaded < last.total
        ? pages.length
        : undefined;
    },
    enabled: enabled && q.length > 0,
    staleTime: 60 * 1000,
  });
}

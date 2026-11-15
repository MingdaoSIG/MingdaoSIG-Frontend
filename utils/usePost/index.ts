import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { TThread } from "@/interfaces/Thread";
import { ApiError, apiRequest } from "@/modules/api/client";
import { bookmarkKeys } from "@/utils/useBookmarks";

type PostQuery = {
  pageSize: number;
  sort?: string;
};

// Every list query throws an ApiError unless the backend answered 2000 with
// an array, so components see a clean error state instead of `undefined`
// pages (which used to crash the home page on any non-2000 answer).

function invalidResponse(result: {
  status: number;
  httpStatus: number;
  body: unknown;
}) {
  return new ApiError({
    ok: false,
    kind: "invalid-response",
    status: result.status,
    httpStatus: result.httpStatus,
    message: "伺服器暫時無法回應，請稍後再試",
    body: result.body,
  });
}

/** One page of a post list, plus `total` when the backend sends it. */
async function fetchPosts(
  path: string,
  query: Record<string, string | number | undefined>,
  signal: AbortSignal,
  /** Send the signed-in user's token (lists that depend on who asks). */
  auth: boolean = false,
): Promise<{ posts: TThread[]; total: number | null }> {
  const result = await apiRequest<TThread[]>(path, { query, signal, auth });
  if (!result.ok) {
    throw new ApiError(result);
  }
  if (!Array.isArray(result.data)) {
    throw invalidResponse(result);
  }
  const total = result.body.total;
  return {
    posts: result.data,
    total: typeof total === "number" ? total : null,
  };
}

/** `sort` omitted means the backend default (most liked first). */
async function fetchPostPage(
  path: string,
  query: PostQuery & { days?: number },
  pageParam: unknown,
  signal: AbortSignal,
  auth: boolean = false,
): Promise<TThread[]> {
  const page = Number(pageParam);
  const { posts } = await fetchPosts(
    path,
    {
      skip: (page === 0 ? 0 : page - 1) * query.pageSize,
      limit: query.pageSize,
      sort: query.sort,
      days: query.days,
    },
    signal,
    auth,
  );
  return posts;
}

function usePostList(
  key: readonly unknown[],
  path: string,
  query: PostQuery,
  enabled: boolean = true,
  /** Lists that take no `sort` (hashtag, liked) send none. */
  sortable: boolean = true,
  /** The signed-in user's own lists (bookmarks) send the token. */
  auth: boolean = false,
) {
  return useInfiniteQuery<TThread[], Error>({
    queryKey: [...key, query],
    queryFn: ({ pageParam, signal }) =>
      fetchPostPage(
        path,
        {
          ...query,
          sort: sortable ? (query.sort ?? "latest") : undefined,
        },
        pageParam,
        signal,
        auth,
      ),
    enabled,
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage = [], allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 0,
  });
}

export const useAllPost = (query: PostQuery) =>
  usePostList(["allPost"], "/post/list", query);

export const useUserPost = (userId: string, query: PostQuery) =>
  usePostList(
    ["userPost", userId],
    `/post/list/user/${encodeURIComponent(userId)}`,
    query,
    Boolean(userId),
  );

/** Posts the user liked (their own profile's 「按讚過的貼文」 tab). */
export const useUserLikedPost = (
  userId: string,
  query: PostQuery,
  enabled: boolean = true,
) =>
  usePostList(
    ["userLikedPost", userId],
    `/post/list/user/${encodeURIComponent(userId)}/like`,
    query,
    Boolean(userId) && enabled,
    false,
  );

/**
 * The signed-in user's bookmarks, newest bookmark first (contract v4
 * §4.3). Keyed under `bookmarkKeys.list`, so a toggle refreshes it.
 */
export const useBookmarkedPost = (userId: string, query: PostQuery) =>
  usePostList(
    bookmarkKeys.list(userId),
    "/user/me/bookmarks",
    query,
    Boolean(userId),
    false,
    true,
  );

export const useSigPost = (sigId: string, query: PostQuery) =>
  usePostList(
    ["sigPost", sigId],
    `/post/list/sig/${encodeURIComponent(sigId)}`,
    query,
    Boolean(sigId),
  );

/** Posts with a hashtag (contract v3 §4.4), newest first. */
export const useHashtagPost = (tag: string, query: PostQuery) =>
  usePostList(
    ["hashtagPost", tag.toLowerCase()],
    `/post/list/hashtag/${encodeURIComponent(tag)}`,
    query,
    Boolean(tag),
    false,
  );

// ---------------------------------------------------------------------
// Two different lists (owner, 2026-11-15):
// - the 熱門貼文 card: the all-time most liked posts (sort=mostLikes);
// - the home 熱門 tab: the backend's hot order (sort=hot), engagement that
//   decays with age (@module/HotPosts in the backend).
// ---------------------------------------------------------------------

/** The 熱門貼文 card: the site's all-time most liked posts. */
export const useTopPost = (query: PostQuery) =>
  useInfiniteQuery<TThread[], Error>({
    queryKey: ["topPost", query.pageSize],
    queryFn: ({ signal }) =>
      fetchPostPage(
        "/post/list",
        { pageSize: query.pageSize, sort: "mostLikes" },
        0,
        signal,
      ),
    staleTime: 5 * 60 * 1000,
    getNextPageParam: () => undefined,
    initialPageParam: 0,
  });

/** The home 熱門 tab: the hot order, paginated. */
export const useHotPostList = (query: PostQuery, enabled: boolean = true) =>
  useInfiniteQuery<TThread[], Error>({
    queryKey: ["hotPost", query.pageSize],
    queryFn: ({ pageParam, signal }) =>
      fetchPostPage(
        "/post/list",
        { pageSize: query.pageSize, sort: "hot" },
        Number(pageParam),
        signal,
      ),
    enabled,
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage, allPages) =>
      // fetchPostPage skips (page - 1) pages for page ≥ 1, as elsewhere here.
      lastPage.length < query.pageSize ? undefined : allPages.length + 1,
    initialPageParam: 0,
  });

/**
 * The home 「我的 SIG」 tab (contract v4 §2.5): newest posts of the SIGs
 * the user is in or manages. Needs a login; the key carries the user id.
 */
export const useMySigPost = (
  userId: string,
  query: Pick<PostQuery, "pageSize">,
  enabled: boolean = true,
) =>
  useInfiniteQuery<TThread[], Error>({
    queryKey: ["mySigPost", userId, query],
    queryFn: async ({ pageParam, signal }) => {
      const page = Number(pageParam);
      const { posts } = await fetchPosts(
        "/post/list/mysig",
        { skip: page * query.pageSize, limit: query.pageSize },
        signal,
        true,
      );
      return posts;
    },
    enabled: enabled && Boolean(userId),
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length >= query.pageSize ? allPages.length : undefined,
    initialPageParam: 0,
  });

/** Pinned posts for the top of the home feed (`/post/list/pinned`). */
export const usePinnedPost = () =>
  useQuery<TThread[], Error>({
    queryKey: ["pinnedPost"],
    queryFn: async ({ signal }) => {
      const { posts } = await fetchPosts("/post/list/pinned", {}, signal);
      return posts.filter(
        (post) => typeof post?._id === "string" && post.removed !== true,
      );
    },
    staleTime: 1 * 60 * 1000,
  });

// ---------------------------------------------------------------------
// Search (contract v3 §4.3) and top hashtags (§4.4).
// ---------------------------------------------------------------------

export const SEARCH_PAGE_SIZE = 20;

type SearchPage = { posts: TThread[]; total: number | null };

export const useSearchPost = (q: string) => {
  const result = useInfiniteQuery<SearchPage, Error>({
    queryKey: ["searchPost", q],
    queryFn: ({ pageParam, signal }) =>
      fetchPosts(
        "/post/search",
        {
          q,
          skip: Number(pageParam) * SEARCH_PAGE_SIZE,
          limit: SEARCH_PAGE_SIZE,
        },
        signal,
      ),
    enabled: q.length > 0,
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, page) => n + page.posts.length, 0);
      if (lastPage.posts.length === 0) {
        return undefined;
      }
      if (lastPage.total !== null && loaded >= lastPage.total) {
        return undefined;
      }
      return allPages.length;
    },
    initialPageParam: 0,
  });
  return {
    ...result,
    total: result.data?.pages[0]?.total ?? null,
    data: result.data
      ? {
          pages: result.data.pages.map((page) => page.posts),
          pageParams: result.data.pageParams,
        }
      : undefined,
  };
};

export type TopTag = { tag: string; count: number };

export const useTopTags = (limit: number = 20) =>
  useQuery<TopTag[], Error>({
    queryKey: ["topTags", limit],
    queryFn: async ({ signal }) => {
      const result = await apiRequest<unknown>("/post/hashtags/top", {
        query: { limit },
        signal,
      });
      if (!result.ok) {
        throw new ApiError(result);
      }
      if (!Array.isArray(result.data)) {
        throw invalidResponse(result);
      }
      return result.data
        .filter(
          (item): item is TopTag =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as TopTag).tag === "string" &&
            (item as TopTag).tag.replace(/^#+/, "").trim() !== "",
        )
        .map((item) => ({
          tag: item.tag.replace(/^#+/, "").trim(),
          count: typeof item.count === "number" ? item.count : 0,
        }));
    },
    staleTime: 5 * 60 * 1000,
  });

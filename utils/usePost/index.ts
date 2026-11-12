import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { TThread } from "@/interfaces/Thread";
import { ApiError, apiRequest } from "@/modules/api/client";

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
): Promise<{ posts: TThread[]; total: number | null }> {
  const result = await apiRequest<TThread[]>(path, { query, signal });
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
// Hot posts (contract v3 §4.5): the most liked posts of the last 30 days.
// When fewer than 3 of those have a like, widen to 180 days, then to all
// time. The first page picks the window; later pages keep it.
// ---------------------------------------------------------------------

const HOT_WINDOWS: (number | undefined)[] = [30, 180, undefined];
const HOT_MIN_LIKED = 3;

function likedCount(posts: TThread[]) {
  return posts.filter((post) => (post.likes ?? 0) > 0).length;
}

type HotPage = { posts: TThread[]; days: number | undefined };

async function fetchHotPage(
  pageSize: number,
  pageParam: unknown,
  signal: AbortSignal,
): Promise<HotPage> {
  const param = pageParam as { page: number; days?: number } | null;
  if (param) {
    const posts = await fetchPostPage(
      "/post/list",
      { pageSize, sort: "mostLikes", days: param.days },
      param.page,
      signal,
    );
    return { posts, days: param.days };
  }
  let last: HotPage = { posts: [], days: undefined };
  for (const days of HOT_WINDOWS) {
    const posts = await fetchPostPage(
      "/post/list",
      // The window is decided on at least 3 posts, whatever the page size.
      { pageSize: Math.max(pageSize, HOT_MIN_LIKED), sort: "mostLikes", days },
      0,
      signal,
    );
    last = { posts: posts.slice(0, pageSize), days };
    if (likedCount(posts) >= HOT_MIN_LIKED) {
      break;
    }
  }
  return last;
}

/** Hot posts as plain post pages, the shape the post lists take. */
function useHotPosts(pageSize: number, paginate: boolean, enabled: boolean) {
  const result = useInfiniteQuery<HotPage, Error>({
    queryKey: ["hotPost", pageSize, paginate],
    queryFn: ({ pageParam, signal }) =>
      fetchHotPage(pageSize, pageParam, signal),
    enabled,
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage, allPages) =>
      paginate && lastPage.posts.length > 0
        ? { page: allPages.length + 1, days: allPages[0]?.days }
        : undefined,
    initialPageParam: null,
  });
  return {
    ...result,
    data: result.data
      ? {
          pages: result.data.pages.map((page) => page.posts),
          pageParams: result.data.pageParams,
        }
      : undefined,
  };
}

/** The 熱門貼文 card: one page of hot posts. */
export const useTopPost = (query: PostQuery) =>
  useHotPosts(query.pageSize, false, true);

/** The mobile home 熱門 tab: hot posts, paginated. */
export const useHotPostList = (query: PostQuery, enabled: boolean = true) =>
  useHotPosts(query.pageSize, true, enabled);

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

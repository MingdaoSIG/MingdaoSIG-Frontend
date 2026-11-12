import { useInfiniteQuery } from "@tanstack/react-query";
import type { TThread } from "@/interfaces/Thread";
import { ApiError, apiRequest } from "@/modules/api/client";

type PostQuery = {
  pageSize: number;
  sort?: string;
};

// Every list query throws an ApiError unless the backend answered 2000 with
// an array, so components see a clean error state instead of `undefined`
// pages (which used to crash the home page on any non-2000 answer).

/** `sort` omitted means the backend default (most liked first). */
async function fetchPostPage(
  path: string,
  query: PostQuery,
  pageParam: unknown,
  signal: AbortSignal,
): Promise<TThread[]> {
  const page = Number(pageParam);
  const result = await apiRequest<TThread[]>(path, {
    query: {
      skip: (page === 0 ? 0 : page - 1) * query.pageSize,
      limit: query.pageSize,
      sort: query.sort,
    },
    signal,
  });
  if (!result.ok) {
    throw new ApiError(result);
  }
  if (!Array.isArray(result.data)) {
    throw new ApiError({
      ok: false,
      kind: "invalid-response",
      status: result.status,
      httpStatus: result.httpStatus,
      message: "伺服器暫時無法回應，請稍後再試",
      body: result.body,
    });
  }
  return result.data;
}

function usePostList(
  key: readonly unknown[],
  path: string,
  query: PostQuery,
  enabled: boolean = true,
) {
  return useInfiniteQuery<TThread[], Error>({
    queryKey: [...key, query],
    queryFn: ({ pageParam, signal }) =>
      fetchPostPage(
        path,
        { ...query, sort: query.sort ?? "latest" },
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

export const useSigPost = (sigId: string, query: PostQuery) =>
  usePostList(
    ["sigPost", sigId],
    `/post/list/sig/${encodeURIComponent(sigId)}`,
    query,
    Boolean(sigId),
  );

export const useTopPost = (query: PostQuery) =>
  useInfiniteQuery<TThread[], Error>({
    queryKey: ["topPost", query],
    queryFn: ({ signal }) =>
      fetchPostPage("/post/list", { pageSize: query.pageSize }, 0, signal),
    staleTime: 1 * 60 * 1000,
    getNextPageParam: () => undefined,
    initialPageParam: 0,
  });

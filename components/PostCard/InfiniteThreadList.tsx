"use client";

import { type QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import type { TThread } from "@/interfaces/Thread";
import { getErrorMessage } from "@/modules/api/client";
import { PostCard, PostCardSkeleton } from "./PostCard";
import { isThread } from "./post";

// A post list that loads the next page when its end scrolls into view
// (an IntersectionObserver sentinel, 600px ahead, inside the nearest
// scrolling ancestor). Feed it either:
// - `fetchPage(skip, limit, signal)` + `queryKey`: it pages with
//   react-query itself (`useThreadPages`), or
// - `query`: an infinite query you already have (`useAllPost`,
//   `useSigPost`, `useSearchPost`… from utils/usePost).
// Posts are deduplicated by `_id` (offset paging repeats a post when a new
// one arrives between pages), and a page is never requested twice.

export type ThreadPage = { items: TThread[]; total?: number | null };

export type FetchThreadPage = (
  skip: number,
  limit: number,
  signal: AbortSignal,
) => Promise<ThreadPage>;

/** The parts of an infinite query the list needs. */
export type ThreadListQuery = {
  data: { pages: unknown[] } | undefined;
  fetchNextPage: (options?: { cancelRefetch?: boolean }) => Promise<unknown>;
  /** Missing: keep asking until a page comes back empty. */
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  isPending?: boolean;
  isLoading?: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
};

type CommonProps = {
  /** Above the list (tabs, filters); stays while the list loads. */
  header?: ReactNode;
  /** Shown first, with 「置頂」 (and the big image when they have a cover). */
  pinned?: TThread[];
  /** Leave posts out (e.g. the announcement SIG). */
  filter?: (post: TThread) => boolean;
  /** Your own card; defaults to the compact `PostCard`. */
  renderItem?: (post: TThread, index: number) => ReactNode;
  /** Shown when there is nothing at all. Default 「還沒有貼文」. */
  empty?: ReactNode;
  /** After the last page; `null` shows nothing. */
  endText?: string | null;
  /** Skeleton cards while the first page loads. */
  skeletons?: number;
  /** Hide the SIG on the default cards (lists of one SIG). */
  hideSig?: boolean;
  /** Mark these words on the default cards (search results). */
  highlight?: string;
  /** Accessible name of the feed. */
  label?: string;
  className?: string;
};

export type InfiniteThreadListProps = CommonProps &
  (
    | {
        fetchPage: FetchThreadPage;
        /** Cache key for the pages; include everything fetchPage uses. */
        queryKey: QueryKey;
        pageSize?: number;
        enabled?: boolean;
        query?: never;
      }
    | {
        query: ThreadListQuery;
        fetchPage?: never;
        queryKey?: never;
        pageSize?: never;
        enabled?: never;
      }
  );

/**
 * Pages of posts through `fetchPage(skip, limit)`. The next `skip` is the
 * number of posts received so far; paging stops at `total`, or at a short
 * page when the backend sends no total.
 */
export function useThreadPages(
  queryKey: QueryKey,
  fetchPage: FetchThreadPage,
  pageSize: number = 10,
  enabled: boolean = true,
) {
  return useInfiniteQuery<ThreadPage, Error>({
    queryKey: [...queryKey, "threadPages", pageSize],
    queryFn: ({ pageParam, signal }) =>
      fetchPage(Number(pageParam) || 0, pageSize, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const received = allPages.reduce(
        (sum, page) => sum + (page.items?.length ?? 0),
        0,
      );
      const count = lastPage.items?.length ?? 0;
      if (count === 0) {
        return undefined;
      }
      if (typeof lastPage.total === "number") {
        return received < lastPage.total ? received : undefined;
      }
      return count < pageSize ? undefined : received;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

/** The nearest ancestor that scrolls, or null for the viewport. */
function scrollParent(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = window.getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(overflowY)) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function pagesToPosts(pages: unknown[] | undefined): TThread[] {
  const posts: TThread[] = [];
  for (const page of pages ?? []) {
    const items = Array.isArray(page)
      ? page
      : Array.isArray((page as ThreadPage | null)?.items)
        ? (page as ThreadPage).items
        : [];
    for (const item of items) {
      if (isThread(item)) {
        posts.push(item);
      }
    }
  }
  return posts;
}

function ListError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface px-6 py-10 text-center text-ink-500 text-sm shadow-card"
    >
      <p>{getErrorMessage(error)}</p>
      <button
        type="button"
        className="h-10 cursor-pointer rounded-control border border-line-strong bg-surface px-4 font-semibold text-ink-800 text-sm transition-colors hover:bg-field"
        onClick={onRetry}
      >
        重試
      </button>
    </div>
  );
}

function ThreadListView({
  query,
  header,
  pinned,
  filter,
  renderItem,
  empty,
  endText = "沒有更多貼文了",
  skeletons = 4,
  hideSig = false,
  highlight,
  label = "貼文列表",
  className = "",
}: CommonProps & { query: ThreadListQuery }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const requested = useRef(false);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    refetch,
  } = query;
  // A disabled query (waiting for the login) shows the skeleton too.
  const loading =
    !data && !error && Boolean(query.isPending ?? query.isLoading);

  const { pinnedPosts, posts } = useMemo(() => {
    const seen = new Set<string>();
    const keep = (post: TThread) => {
      const id = post._id as string;
      if (seen.has(id) || (filter && !filter(post))) {
        return false;
      }
      seen.add(id);
      return true;
    };
    const first = (pinned ?? []).filter(isThread).filter(keep);
    const rest = pagesToPosts(data?.pages).filter(keep);
    return { pinnedPosts: first, posts: rest };
  }, [data, pinned, filter]);

  const total = pinnedPosts.length + posts.length;
  // `hasNextPage` undefined (older helpers): keep going until an empty page.
  const lastPage = data?.pages?.[data.pages.length - 1];
  const moreToLoad =
    hasNextPage ??
    (data !== undefined && pagesToPosts(lastPage ? [lastPage] : []).length > 0);
  const failed = Boolean(error);
  const canLoad = !loading && !failed && !isFetchingNextPage && moreToLoad;

  // Latest values for the observer callback, which outlives renders.
  const latest = useRef({ canLoad, fetchNextPage });
  latest.current = { canLoad, fetchNextPage };

  useEffect(() => {
    if (!isFetchingNextPage) {
      requested.current = false;
    }
  }, [isFetchingNextPage]);

  // Re-observed after each page, so a sentinel that is still in view
  // (short pages, tall screens) asks for the next one.
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !canLoad) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        if (!latest.current.canLoad || requested.current) {
          return;
        }
        requested.current = true;
        void latest.current.fetchNextPage({ cancelRefetch: false });
      },
      { root: scrollParent(target), rootMargin: "0px 0px 600px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [canLoad, total]);

  const render =
    renderItem ??
    ((post: TThread, index: number) => (
      <PostCard
        key={post._id}
        post={post}
        eager={index < 2}
        hideSig={hideSig}
        highlight={highlight}
      />
    ));

  let body: ReactNode;
  if (loading) {
    body = (
      <div className="flex flex-col gap-3" aria-hidden>
        {Array.from({ length: skeletons }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholders
          <PostCardSkeleton key={index} />
        ))}
      </div>
    );
  } else if (total === 0 && failed) {
    body = <ListError error={error} onRetry={() => void refetch()} />;
  } else if (total === 0) {
    body = empty ?? (
      <p className="rounded-card border border-line border-dashed px-6 py-12 text-center text-ink-500 text-sm">
        還沒有貼文
      </p>
    );
  } else {
    body = (
      <div
        role="feed"
        aria-label={label}
        aria-busy={isFetchingNextPage}
        className="flex flex-col gap-3"
      >
        {pinnedPosts.map((post, index) =>
          renderItem ? (
            renderItem(post, index)
          ) : (
            <PostCard
              key={`pinned-${post._id}`}
              post={post}
              variant="featured"
              pinned
              eager={index < 1}
              hideSig={hideSig}
            />
          ),
        )}
        {posts.map((post, index) => render(post, pinnedPosts.length + index))}
        {isFetchingNextPage && <PostCardSkeleton />}
        {failed && !isFetchingNextPage && (
          <div
            role="alert"
            className="flex items-center justify-center gap-3 py-3 text-ink-500 text-sm"
          >
            <span>{getErrorMessage(error)}</span>
            <button
              type="button"
              className="h-9 cursor-pointer rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-800 transition-colors hover:bg-field"
              onClick={() => void fetchNextPage({ cancelRefetch: false })}
            >
              重試
            </button>
          </div>
        )}
        {!moreToLoad && !failed && !isFetchingNextPage && endText && (
          <p data-list-end className="py-3 text-center text-ink-400 text-xs">
            {endText}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex min-w-0 flex-col gap-3 ${className}`}>
      {header}
      {body}
      <div ref={sentinel} aria-hidden className="h-px w-full shrink-0" />
    </div>
  );
}

function FetchingList({
  fetchPage,
  queryKey,
  pageSize = 10,
  enabled = true,
  ...rest
}: CommonProps & {
  fetchPage: FetchThreadPage;
  queryKey: QueryKey;
  pageSize?: number;
  enabled?: boolean;
}) {
  const query = useThreadPages(queryKey, fetchPage, pageSize, enabled);
  return <ThreadListView {...rest} query={query} />;
}

/** See the top of this file. */
export function InfiniteThreadList(props: InfiniteThreadListProps) {
  if (props.query) {
    return <ThreadListView {...props} query={props.query} />;
  }
  return (
    <FetchingList
      {...props}
      fetchPage={props.fetchPage}
      queryKey={props.queryKey}
    />
  );
}

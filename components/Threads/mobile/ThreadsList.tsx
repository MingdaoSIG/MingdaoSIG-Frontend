import type { InfiniteData } from "@tanstack/react-query";
import { Fragment, useCallback, useEffect, useRef } from "react";
import { PostCard, PostCardSkeleton } from "@/components/PostCard/PostCard";
import { isThread, postSigOf } from "@/components/PostCard/post";
import type { Sig } from "@/interfaces/Sig";
import type { TThread } from "@/interfaces/Thread";
import { getErrorMessage } from "@/modules/api/client";
import { BRAND_COLOR } from "@/modules/sigTheme";
import { useSigColor } from "@/modules/sigTheme/useSigColor";
import {
  announcementSigId,
  announcementStayTime,
} from "../configs/announcement";

// The older paged lists on phones (home, search, tag and profile pages).
// Since the 2026 user-side redesign they render the compact `PostCard`
// in one column; new lists use components/PostCard/InfiniteThreadList.

function sigIdOf(thread: TThread) {
  return postSigOf(thread)?._id;
}

/** SIG name on a light tint of the SIG colour (raw colour as text is unreadable for pinks). */
export const SigChip = ({
  sig,
  className = "",
}: {
  sig: Pick<Sig, "_id" | "name" | "color">;
  className?: string;
}) => {
  const colorOf = useSigColor();
  return (
    <span
      className={`sig-text shrink-0 rounded-chip bg-[color-mix(in_srgb,var(--sig-color)_12%,white)] px-2 py-0.5 font-semibold text-xs ${className}`}
      style={{
        ["--sig-color" as string]: colorOf(sig, BRAND_COLOR),
      }}
    >
      {sig.name}
    </span>
  );
};

/** Shown when a post list could not be loaded. */
export const ThreadsListError = ({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) => (
  <div
    role="alert"
    className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-3 text-ink-500"
  >
    <p>{getErrorMessage(error)}</p>
    {onRetry && (
      <button
        type="button"
        className="rounded-control border border-line bg-surface px-4 py-2 text-ink-800 text-sm"
        onClick={() => onRetry()}
      >
        重試
      </button>
    )}
  </div>
);

export const InfinityThreadsList = ({
  data,
  height,
  fetchNextPage,
  isFetchingNextPage,
  announcementData,
  pinnedData,
  error,
  onRetry,
  emptyText = "還沒有貼文",
}: {
  data: InfiniteData<TThread[], unknown> | undefined;
  height?: string;
  fetchNextPage: () => Promise<unknown>;
  isFetchingNextPage: boolean;
  announcementData?: InfiniteData<TThread[], unknown>;
  /** Pinned posts, shown first with 「置頂」 (home feed only). */
  pinnedData?: TThread[];
  /** Error from the list query, if the last fetch failed. */
  error?: Error | null;
  onRetry?: () => void;
  emptyText?: string;
}) => {
  const postList = useRef(null);
  const pinned = (pinnedData ?? []).filter(isThread);
  const pinnedIds = new Set(pinned.map((post) => post._id));
  const pages = (data?.pages ?? []).map((page) =>
    Array.isArray(page)
      ? page.filter((item) => isThread(item) && !pinnedIds.has(item._id))
      : [],
  );
  const hasPosts = pages.some((page) => page.length > 0) || pinned.length > 0;
  const failed = Boolean(error);

  // The announcement query may fail or come back empty: only a real,
  // recent announcement is shown.
  const firstAnnouncement = announcementData?.pages?.[0]?.[0];
  const announcement = isThread(firstAnnouncement) ? firstAnnouncement : null;
  const showAnnouncement =
    announcement !== null &&
    Math.floor(
      (Date.now() - new Date(announcement.createdAt ?? "").getTime()) /
        (1000 * 60 * 60 * 24),
    ) < announcementStayTime;

  const onScroll = useCallback(() => {
    if (postList.current) {
      const { scrollTop, scrollHeight, clientHeight } = postList.current;
      // 距離底部 1200px 時就開始加載（更早觸發）
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 1200;

      // Stop after a failed page: the user retries with the button.
      if (isNearBottom && !isFetchingNextPage && !failed) {
        fetchNextPage();
      }
    }
  }, [fetchNextPage, isFetchingNextPage, failed]);

  useEffect(() => {
    const listInnerElement = postList.current as HTMLElement | null;

    if (listInnerElement) {
      // 監聽滾輪滾動（桌面）
      listInnerElement.addEventListener("scroll", onScroll);
      // 監聽觸控滑動（手機）
      listInnerElement.addEventListener("touchmove", onScroll);

      return () => {
        listInnerElement.removeEventListener("scroll", onScroll);
        listInnerElement.removeEventListener("touchmove", onScroll);
      };
    }
  }, [onScroll]);

  if (!hasPosts && failed) {
    return (
      <div style={{ height }} className="w-full">
        <ThreadsListError error={error} onRetry={onRetry} />
      </div>
    );
  }

  return hasPosts ? (
    <div
      className="scrollbar-hide w-full overflow-y-auto"
      style={{ height }}
      ref={postList}
    >
      {/* Announcement Section */}
      {showAnnouncement && (
        <div key={announcement._id} className="mb-3">
          <PostCard post={announcement} eager />
        </div>
      )}

      {/* Threads Grid */}
      <div className="flex flex-col gap-3">
        {pinned.map((item) =>
          showAnnouncement && item._id === announcement._id ? null : (
            <PostCard
              post={item}
              eager
              key={`pinned-${item._id}`}
              variant="featured"
              pinned
            />
          ),
        )}
        {pages.map((page: TThread[], pageIndex: number) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: paginated data has no unique page identifier
          <Fragment key={`page-${pageIndex}`}>
            {page.map((item, itemIndex) => {
              const isAnnouncement = sigIdOf(item) === announcementSigId;
              // Calculate global index for priority
              const globalIndex = pageIndex * page.length + itemIndex;
              const shouldPrioritize = globalIndex < 4;

              if (!isAnnouncement) {
                return (
                  <PostCard
                    post={item}
                    eager={shouldPrioritize}
                    key={item._id}
                  />
                );
              }
              return null;
            })}
          </Fragment>
        ))}
        {isFetchingNextPage && (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        )}
      </div>
      {failed && !isFetchingNextPage && (
        <div
          role="alert"
          className="flex items-center justify-center gap-3 py-4 text-ink-500 text-sm"
        >
          <span>{getErrorMessage(error)}</span>
          <button
            type="button"
            className="rounded-control border border-line bg-surface px-3 py-1.5 text-ink-800"
            onClick={() => fetchNextPage()}
          >
            重試
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex h-full w-full items-center justify-center">
      <h1 className="text-ink-500 text-lg">{emptyText}</h1>
    </div>
  );
};

export const ThreadsListSkeleton = ({
  repeat,
  height,
}: {
  repeat: number;
  height?: string;
}) => {
  return (
    <div className="w-full overflow-y-auto" style={{ height }}>
      <div className="flex flex-col gap-3">
        {[...Array(repeat)].map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no unique identifier
          <PostCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
};

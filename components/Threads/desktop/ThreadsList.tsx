import type { InfiniteData } from "@tanstack/react-query";
import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { PostCard, PostCardSkeleton } from "@/components/PostCard/PostCard";
import { isThread, postSigOf } from "@/components/PostCard/post";
import type { TThread } from "@/interfaces/Thread";
import { getErrorMessage } from "@/modules/api/client";
import { tagHref } from "@/modules/hashtag";
import {
  announcementSigId,
  announcementStayTime,
} from "../configs/announcement";

// The older paged lists (home, search, tag and profile pages). Since the
// 2026 user-side redesign they render the compact `PostCard`; new lists
// use components/PostCard/InfiniteThreadList instead.

function sigIdOf(thread: TThread) {
  return postSigOf(thread)?._id;
}

/** A post's hashtags, each linking to its /tag page. */
export const HashtagLinks = ({
  tags,
  className = "",
  chipClassName = "",
}: {
  tags: string[];
  className?: string;
  chipClassName?: string;
}) => (
  <div className={className}>
    {tags.map((tag) => {
      const href = tagHref(tag);
      return href ? (
        <Link
          key={tag}
          href={href}
          className={`whitespace-nowrap rounded-chip bg-brand-50 px-2.5 py-1 font-medium text-brand-800 text-xs transition-colors hover:bg-[color-mix(in_srgb,var(--color-brand-700)_16%,white)] ${chipClassName}`}
        >
          #{tag}
        </Link>
      ) : null;
    })}
  </div>
);

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
    className="flex h-64 flex-col items-center justify-center gap-3 text-ink-500"
  >
    <p>{getErrorMessage(error)}</p>
    {onRetry && (
      <button
        type="button"
        className="cursor-pointer rounded-control border border-line px-4 py-2 text-ink-800 text-sm hover:bg-field"
        onClick={() => onRetry()}
      >
        重試
      </button>
    )}
  </div>
);

export const InfinityThreadsList = ({
  data,
  fetchNextPage,
  isFetchingNextPage,
  announcementData,
  pinnedData,
  error,
  onRetry,
  emptyText = "還沒有貼文",
}: {
  data: InfiniteData<TThread[], unknown> | undefined;
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
  const sentinel = useRef<HTMLDivElement>(null);
  const pinned = (pinnedData ?? []).filter(isThread);
  const pinnedIds = new Set(pinned.map((post) => post._id));
  const pages = (data?.pages ?? []).map((page) =>
    Array.isArray(page)
      ? page.filter((item) => isThread(item) && !pinnedIds.has(item._id))
      : [],
  );
  const hasPosts = pages.some((page) => page.length > 0) || pinned.length > 0;
  const failed = Boolean(error);

  // Load the next page when the end of the list comes within 600px of the
  // viewport (desktop pages scroll the window).
  useEffect(() => {
    const target = sentinel.current;
    if (!target) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        // Stop after a failed page: the user retries with the button.
        if (entries[0]?.isIntersecting && !isFetchingNextPage && !failed) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: "0px 0px 600px 0px",
      },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, isFetchingNextPage, failed, hasPosts]);

  if (!hasPosts) {
    if (failed) {
      return <ThreadsListError error={error} onRetry={onRetry} />;
    }
    return (
      <div className="flex h-64 items-center justify-center text-ink-500 text-lg">
        {emptyText}
      </div>
    );
  }

  const firstAnnouncement = announcementData?.pages?.[0]?.[0];
  const announcement = isThread(firstAnnouncement) ? firstAnnouncement : null;
  const showAnnouncement =
    announcement &&
    Math.floor(
      (Date.now() - new Date(announcement.createdAt ?? "").getTime()) /
        (1000 * 60 * 60 * 24),
    ) < announcementStayTime;

  return (
    <div className="flex flex-col gap-3">
      {showAnnouncement && (
        <PostCard post={announcement} key={announcement._id} />
      )}
      {pinned.map((item, index) =>
        showAnnouncement && item._id === announcement._id ? null : (
          <PostCard
            post={item}
            key={`pinned-${item._id}`}
            variant="featured"
            eager={index < 2}
            pinned
          />
        ),
      )}
      {pages.map((page: TThread[], pageIndex: number) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: paginated data has no unique page identifier
        <Fragment key={`page-${pageIndex}`}>
          {page.map((item, itemIndex) => {
            if (sigIdOf(item) === announcementSigId) {
              return null;
            }
            return (
              <PostCard
                post={item}
                key={item._id}
                eager={pageIndex === 0 && itemIndex < 2}
              />
            );
          })}
        </Fragment>
      ))}
      {isFetchingNextPage && <PostCardSkeleton />}
      {failed && !isFetchingNextPage && (
        <div
          role="alert"
          className="flex items-center justify-center gap-3 py-4 text-ink-500 text-sm"
        >
          <span>{getErrorMessage(error)}</span>
          <button
            type="button"
            className="cursor-pointer rounded-control border border-line px-3 py-1.5 text-ink-800 hover:bg-field"
            onClick={() => fetchNextPage()}
          >
            重試
          </button>
        </div>
      )}
      <div ref={sentinel} aria-hidden className="h-px w-full" />
    </div>
  );
};

export const ThreadsListSkeleton = ({ repeat }: { repeat: number }) => {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(repeat)].map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no unique identifier
        <PostCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
};

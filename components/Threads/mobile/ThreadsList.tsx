import type { InfiniteData } from "@tanstack/react-query";
import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef } from "react";
import type { Sig } from "@/interfaces/Sig";
// Interfaces, Types
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
import { getErrorMessage } from "@/modules/api/client";
import { postTags } from "@/modules/hashtag";
import { imageUrl } from "@/modules/imageUrl";
import { BRAND_COLOR } from "@/modules/sigTheme";
import { useSigColor } from "@/modules/sigTheme/useSigColor";
import {
  announcementSigId,
  announcementStayTime,
} from "../configs/announcement";
// Configs
import { HashtagLinks, PinnedChip } from "../desktop/ThreadsList";
import { postSummary } from "../postSummary";

/** Populated object, or null for a missing / unpopulated reference. */
function asObject<T>(value: unknown): T | null {
  return typeof value === "object" && value !== null ? (value as T) : null;
}

/** Only well-formed posts are rendered; anything else is skipped. */
function isThread(value: unknown): value is TThread {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TThread)._id === "string"
  );
}

function sigIdOf(thread: TThread) {
  return asObject<Sig>(thread.sig)?._id;
}

const Thread = ({
  threadData,
  priority = false,
  pinned = false,
}: {
  threadData: TThread;
  priority?: boolean;
  /** Shown in the pinned section: adds 「置頂」. */
  pinned?: boolean;
}) => {
  const user = asObject<User>(threadData.user);
  const sig = asObject<Sig>(threadData.sig);
  const isAnnouncement = sig?._id === announcementSigId;
  const hashtags = postTags(threadData.hashtag);
  const cover =
    typeof threadData.cover === "string" ? imageUrl(threadData.cover) : "";

  // The title link covers the whole card (its ::after), so the hashtag
  // links can sit on top without nesting links.
  return (
    <article
      className={`relative block select-none overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow active:shadow-card-hover ${
        isAnnouncement ? "shadow-[inset_3px_0_0_var(--color-warm-600)]" : ""
      }`}
    >
      {/* Cover Image */}
      {cover && (
        <div className="relative h-48 w-full bg-field">
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            priority={priority}
            className="object-cover"
          />
        </div>
      )}

      {/* Content Container */}
      <div className="flex min-h-[200px] flex-col p-4">
        {/* Header: User info and Date */}
        {!isAnnouncement && user && (
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[13px] text-ink-700">
                {user?.name}
              </span>
              {sig && <SigChip sig={sig} />}
            </div>
            <div className="shrink-0 text-[13px] text-ink-500">
              {
                new Date(threadData.createdAt ?? "")
                  .toLocaleString("zh-TW")
                  .split(" ")[0]
              }
            </div>
          </div>
        )}

        {/* Title */}
        <h2 className="mb-1.5 flex min-w-0 items-start gap-2 font-semibold text-[1.125rem] text-ink-900 leading-snug">
          {pinned && (
            <span className="mt-0.5 flex">
              <PinnedChip />
            </span>
          )}
          {isAnnouncement && (
            <span className="mt-0.5 shrink-0 rounded-chip bg-warm-600/10 px-2 py-0.5 font-semibold text-warm-600 text-xs">
              公告
            </span>
          )}
          <Link
            href={`/post/${threadData._id}`}
            className="line-clamp-2 after:absolute after:inset-0 after:content-['']"
          >
            {threadData.title}
          </Link>
        </h2>

        {/* Content Preview - Dynamic lines based on hashtags */}
        <p
          className={`mb-3 text-[0.9375rem] text-ink-700 leading-[1.7] ${
            isAnnouncement
              ? "line-clamp-3"
              : hashtags.length > 0
                ? "line-clamp-2"
                : "line-clamp-4"
          }`}
        >
          {postSummary(threadData)}
        </p>

        {/* Hashtags - Horizontal scroll without scrollbar */}
        {hashtags.length > 0 && !isAnnouncement && (
          <HashtagLinks
            tags={hashtags}
            className="scrollbar-hide relative z-[1] mb-3 flex gap-2 overflow-x-auto pb-1"
            chipClassName="flex-shrink-0 py-1.5"
          />
        )}

        {/* Spacer to push footer to bottom */}
        <div className="flex-grow"></div>

        {/* Footer: Likes and Comments */}
        {!isAnnouncement && (
          <div className="mt-1 flex items-center gap-4 pt-1 text-ink-500">
            <span className="flex items-center gap-1.5 text-sm">
              <Heart size={16} aria-label="按讚數" />
              {threadData.likes}
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <MessageCircle size={16} aria-label="留言數" />
              {threadData.comments}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};

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

const ThreadSkeleton = () => {
  return (
    <div className="animate-pulse overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="h-48 w-full bg-field" />
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 rounded-chip bg-field" />
            <div className="h-5 w-20 rounded-chip bg-field" />
          </div>
          <div className="h-4 w-20 rounded-chip bg-field" />
        </div>
        <div className="mb-2 h-6 w-3/4 rounded-chip bg-field" />
        <div className="mb-1 h-4 w-full rounded-chip bg-field" />
        <div className="mb-3 h-4 w-full rounded-chip bg-field" />
        <div className="mb-3 flex gap-2">
          <div className="h-6 w-20 rounded-chip bg-field" />
          <div className="h-6 w-16 rounded-chip bg-field" />
          <div className="h-6 w-24 rounded-chip bg-field" />
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-12 rounded-chip bg-field" />
          <div className="h-4 w-12 rounded-chip bg-field" />
        </div>
      </div>
    </div>
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
        <div key={announcement._id} className="sm:col-span-2">
          <Thread threadData={announcement} priority={true} />
        </div>
      )}

      {/* Threads Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {pinned.map((item) =>
          showAnnouncement && item._id === announcement._id ? null : (
            <Thread
              threadData={item}
              priority={true}
              key={`pinned-${item._id}`}
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
                  <Thread
                    threadData={item}
                    priority={shouldPrioritize}
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
            <ThreadSkeleton />
            <ThreadSkeleton />
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {[...Array(repeat)].map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no unique identifier
          <ThreadSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
};

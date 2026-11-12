import type { InfiniteData } from "@tanstack/react-query";
import { Heart, MessageCircle, Pin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import type { Sig } from "@/interfaces/Sig";
// Interfaces, Types
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
import { getErrorMessage } from "@/modules/api/client";
import { postTags, tagHref } from "@/modules/hashtag";
import { imageUrl } from "@/modules/imageUrl";
import {
  announcementSigId,
  announcementStayTime,
} from "../configs/announcement";
// Configs
import { sigDefaultColors } from "../configs/sigDefaultColors";
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

/** 「置頂」 on a pinned post at the top of the home feed. */
export const PinnedChip = () => (
  <span className="inline-flex shrink-0 items-center gap-1 rounded-chip bg-brand-50 px-2 py-0.5 font-semibold text-brand-800 text-xs">
    <Pin size={12} aria-hidden strokeWidth={2.4} />
    置頂
  </span>
);

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

const Thread = ({
  threadData,
  eager = false,
  pinned = false,
}: {
  threadData: TThread;
  eager?: boolean;
  /** Shown in the pinned section: adds 「置頂」. */
  pinned?: boolean;
}) => {
  const user = asObject<User>(threadData.user);
  const sig = asObject<Sig>(threadData.sig);
  const isAnnouncement = sig?._id === announcementSigId;
  const showMeta = Boolean(user) && !isAnnouncement;
  const showCover =
    !isAnnouncement &&
    typeof threadData.cover === "string" &&
    threadData.cover !== "";
  const hashtags = postTags(threadData.hashtag);

  // The title link covers the whole card (its ::after), so the hashtag
  // links can sit on top without nesting links.
  return (
    <article
      className={`relative flex h-48 select-none overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover ${
        isAnnouncement ? "shadow-[inset_3px_0_0_var(--color-warm-600)]" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col px-6 py-5">
        {showMeta && (
          <div className="flex items-center justify-between gap-4 text-[13px] text-ink-500">
            <p className="flex min-w-0 items-center gap-1.5">
              <span className="truncate">{user?.name}</span>
              <span aria-hidden>•</span>
              <span
                className="sig-text shrink-0 font-semibold"
                style={{
                  ["--sig-color" as string]: sigDefaultColors[sig?._id ?? ""],
                }}
              >
                {sig?.name}
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <span>
                {
                  new Date(threadData.createdAt ?? "")
                    .toLocaleString("zh-TW")
                    .split(" ")[0]
                }
              </span>
              <span className="flex items-center gap-1">
                <Heart size={14} aria-label="按讚數" />
                {threadData.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={14} aria-label="留言數" />
                {threadData.comments}
              </span>
            </div>
          </div>
        )}

        <h2 className="mt-1.5 flex min-w-0 items-center gap-2 font-semibold text-ink-900 text-lg leading-7 tracking-[0.01em]">
          {pinned && <PinnedChip />}
          {isAnnouncement && (
            <span className="shrink-0 rounded-chip bg-warm-600/10 px-2 py-0.5 font-semibold text-warm-600 text-xs">
              公告
            </span>
          )}
          <Link
            href={`/post/${threadData._id}`}
            className="truncate after:absolute after:inset-0 after:content-['']"
          >
            {threadData.title}
          </Link>
        </h2>

        <p
          className={`mt-1 text-[0.9375rem] text-ink-700 leading-[1.7] tracking-[0.01em] ${
            isAnnouncement ? "line-clamp-4" : "line-clamp-2"
          }`}
        >
          {postSummary(threadData)}
        </p>

        {hashtags.length > 0 && !isAnnouncement && (
          <HashtagLinks
            tags={hashtags.slice(0, 3)}
            className="relative z-[1] mt-auto flex flex-wrap gap-2 self-start pt-2"
          />
        )}
      </div>

      {!isAnnouncement && (
        <div className="relative hidden w-1/4 shrink-0 bg-field md:block">
          {showCover && imageUrl(threadData.cover) && (
            <Image
              src={imageUrl(threadData.cover) ?? ""}
              alt=""
              className="object-cover"
              priority={eager}
              sizes="(min-width: 1024px) 20vw, 0px"
              fill
            />
          )}
        </div>
      )}
    </article>
  );
};

const ThreadSkeleton = () => {
  return (
    <div className="flex h-48 overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="flex flex-1 animate-pulse flex-col gap-3 px-6 py-5">
        <div className="h-3.5 w-40 rounded-chip bg-field" />
        <div className="h-6 w-1/2 rounded-chip bg-field" />
        <div className="h-12 w-full rounded-chip bg-field" />
        <div className="mt-auto flex gap-2">
          <div className="h-6 w-14 rounded-chip bg-field" />
          <div className="h-6 w-14 rounded-chip bg-field" />
          <div className="h-6 w-14 rounded-chip bg-field" />
        </div>
      </div>
      <div className="w-1/4 animate-pulse bg-field" />
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
  // scroll container: the SplitBlock column, or the viewport elsewhere.
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
        root: target.closest("[data-split-main]"),
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
    <div className="flex flex-col gap-4">
      {showAnnouncement && (
        <Thread threadData={announcement} key={announcement._id} />
      )}
      {pinned.map((item, index) =>
        showAnnouncement && item._id === announcement._id ? null : (
          <Thread
            threadData={item}
            key={`pinned-${item._id}`}
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
              <Thread
                threadData={item}
                key={item._id}
                eager={pageIndex === 0 && itemIndex < 2}
              />
            );
          })}
        </Fragment>
      ))}
      {isFetchingNextPage && <ThreadSkeleton />}
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
    <div className="flex flex-col gap-4">
      {[...Array(repeat)].map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no unique identifier
        <ThreadSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
};

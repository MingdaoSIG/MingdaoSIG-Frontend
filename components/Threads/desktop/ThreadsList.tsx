import type {
  FetchNextPageOptions,
  InfiniteData,
  InfiniteQueryObserverResult,
} from "@tanstack/react-query";
import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import type { Sig } from "@/interfaces/Sig";
// Interfaces, Types
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
// Modules
import markdownToPlainText from "@/modules/markdownToPlainText";
import {
  announcementSigId,
  announcementStayTime,
} from "../configs/announcement";
// Configs
import { sigDefaultColors } from "../configs/sigDefaultColors";

function fixCoverUrl(cover: string) {
  if (cover.startsWith("http://") || cover.startsWith("https://")) {
    if (cover.includes("lazco.dev")) {
      const pathPart = cover.split("lazco.dev/")[1] || "";
      return `${process.env.NEXT_PUBLIC_API_URL}/${pathPart}`;
    }
    return cover;
  }

  if (cover.startsWith("/image/")) {
    return `${process.env.NEXT_PUBLIC_API_URL}${cover}`;
  }

  return `${process.env.NEXT_PUBLIC_API_URL}/image/${cover}`;
}

const Thread = ({
  threadData,
  eager = false,
}: {
  threadData: TThread;
  eager?: boolean;
}) => {
  const user = threadData.user as unknown as User;
  const sig = threadData.sig as unknown as Sig;
  const isAnnouncement = sig._id === announcementSigId;
  const showMeta = Boolean(user) && !isAnnouncement;
  const showCover = !isAnnouncement && Boolean(threadData.cover);

  return (
    <Link
      href={`/post/${threadData._id}`}
      className={`flex h-48 cursor-pointer select-none overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover ${
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
                  ["--sig-color" as string]: sigDefaultColors[sig._id ?? ""],
                }}
              >
                {sig.name}
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
                <Heart size={14} aria-label="likes" />
                {threadData.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={14} aria-label="comments" />
                {threadData.comments}
              </span>
            </div>
          </div>
        )}

        <h2 className="mt-1.5 flex min-w-0 items-center gap-2 font-semibold text-ink-900 text-lg leading-7 tracking-[0.01em]">
          {isAnnouncement && (
            <span className="shrink-0 rounded-chip bg-warm-600/10 px-2 py-0.5 font-semibold text-warm-600 text-xs">
              公告
            </span>
          )}
          <span className="truncate">{threadData.title}</span>
        </h2>

        <p
          className={`mt-1 text-[0.9375rem] text-ink-700 leading-[1.7] tracking-[0.01em] ${
            isAnnouncement ? "line-clamp-4" : "line-clamp-2"
          }`}
        >
          {markdownToPlainText(threadData.content)}
        </p>

        {threadData.hashtag &&
          threadData.hashtag.length > 0 &&
          !isAnnouncement && (
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              {threadData.hashtag.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="whitespace-nowrap rounded-chip bg-brand-50 px-2.5 py-1 font-medium text-brand-800 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
      </div>

      {!isAnnouncement && (
        <div className="relative hidden w-1/4 shrink-0 bg-field md:block">
          {showCover && (
            <Image
              src={fixCoverUrl(threadData.cover)}
              alt=""
              className="object-cover"
              priority={eager}
              sizes="(min-width: 1024px) 20vw, 0px"
              fill
            />
          )}
        </div>
      )}
    </Link>
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

export const InfinityThreadsList = ({
  data,
  fetchNextPage,
  isFetchingNextPage,
  announcementData,
}: {
  data: InfiniteData<TThread[], unknown> | undefined;
  fetchNextPage: (
    options?: FetchNextPageOptions | undefined,
  ) => Promise<
    InfiniteQueryObserverResult<InfiniteData<TThread[], unknown>, Error>
  >;
  isFetchingNextPage: boolean;
  announcementData?: InfiniteData<TThread[], unknown>;
}) => {
  const sentinel = useRef<HTMLDivElement>(null);

  // Load the next page when the end of the list comes within 600px of the
  // scroll container: the SplitBlock column, or the viewport elsewhere.
  useEffect(() => {
    const target = sentinel.current;
    if (!target) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
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
  }, [fetchNextPage, isFetchingNextPage]);

  if (!data || data.pages[0].length < 1) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-500 text-lg">
        No Post Yet
      </div>
    );
  }

  const announcement = announcementData?.pages[0]?.[0];
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
      {data.pages.map((page: TThread[], pageIndex: number) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: paginated data has no unique page identifier
        <Fragment key={`page-${pageIndex}`}>
          {page.map((item, itemIndex) => {
            const sig = item.sig as unknown as Sig;
            if (sig._id === announcementSigId) {
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

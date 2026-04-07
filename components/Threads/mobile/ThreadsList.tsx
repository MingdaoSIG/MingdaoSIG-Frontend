import type {
  FetchNextPageOptions,
  InfiniteData,
  InfiniteQueryObserverResult,
} from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef } from "react";
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

// Helper function to fix cover URL
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
  priority = false,
}: {
  threadData: TThread;
  priority?: boolean;
}) => {
  const user = threadData.user as User;
  const sig = threadData.sig as unknown as Sig;
  const isAnnouncement = sig._id === announcementSigId;

  return (
    <Link
      href={`/post/${threadData._id}`}
      className={`block cursor-pointer select-none overflow-hidden rounded-2xl bg-white/60 backdrop-blur-sm transition-all hover:bg-white/70 ${
        isAnnouncement ? "bg-white" : ""
      }`}
    >
      {/* Cover Image */}
      {threadData.cover && (
        <div className="relative h-48 w-full bg-gradient-to-b from-gray-100 to-gray-400">
          <Image
            src={fixCoverUrl(threadData.cover)}
            alt={threadData.title}
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
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 text-sm">
                {user?.name}
              </span>
              <span
                className="rounded-full px-3 py-1 font-medium text-white text-xs"
                style={{
                  backgroundColor: sigDefaultColors[sig._id ?? ""] || "#009BB0",
                }}
              >
                {sig.name}
              </span>
            </div>
            <div className="text-gray-500 text-sm">
              {
                new Date(threadData.createdAt ?? "")
                  .toLocaleString("zh-TW")
                  .split(" ")[0]
              }
            </div>
          </div>
        )}

        {/* Title */}
        <h2 className="mb-2 line-clamp-1 font-semibold text-gray-900 text-xl">
          {isAnnouncement && "🔔 公告 - "}
          {threadData.title}
        </h2>

        {/* Content Preview - Dynamic lines based on hashtags */}
        <p
          className={`mb-3 text-gray-700 text-sm leading-relaxed ${
            isAnnouncement
              ? "line-clamp-3"
              : threadData.hashtag && threadData.hashtag.length > 0
                ? "line-clamp-2"
                : "line-clamp-4"
          }`}
        >
          {markdownToPlainText(threadData.content)}
        </p>

        {/* Hashtags - Horizontal scroll without scrollbar */}
        {threadData.hashtag &&
          threadData.hashtag.length > 0 &&
          !isAnnouncement && (
            <div className="scrollbar-hide mb-3 flex gap-2 overflow-x-auto pb-1">
              {threadData.hashtag.map((tag, _index) => (
                <span
                  key={tag}
                  className="flex-shrink-0 whitespace-nowrap rounded-full bg-[#5FCDF5] px-3 py-1 font-semibold text-white text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

        {/* Spacer to push footer to bottom */}
        <div className="flex-grow"></div>

        {/* Footer: Likes and Comments - No border */}
        {!isAnnouncement && (
          <div className="mt-2 flex items-center gap-4 pt-2 text-gray-600">
            <div className="flex items-center gap-1.5">
              <Image
                src="/icons/likes.svg"
                alt="likes"
                width={18}
                height={18}
                className="opacity-60"
              />
              <span className="font-medium text-sm">{threadData.likes}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Image
                src="/icons/comments.svg"
                alt="comments"
                width={18}
                height={18}
                className="opacity-60"
              />
              <span className="font-medium text-sm">{threadData.comments}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

const ThreadSkeleton = () => {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white/60 backdrop-blur-sm">
      {/* Cover Skeleton */}
      <div className="h-48 w-full bg-gradient-to-b from-gray-200 to-gray-300" />

      {/* Content Container */}
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 rounded bg-gray-300"></div>
            <div className="h-6 w-20 rounded-full bg-gray-300"></div>
          </div>
          <div className="h-4 w-20 rounded bg-gray-300"></div>
        </div>
        <div className="mb-2 h-6 w-3/4 rounded bg-gray-300"></div>
        <div className="mb-1 h-4 w-full rounded bg-gray-300"></div>
        <div className="mb-3 h-4 w-full rounded bg-gray-300"></div>
        <div className="mb-3 flex gap-2">
          <div className="h-6 w-20 rounded-full bg-gray-300"></div>
          <div className="h-6 w-16 rounded-full bg-gray-300"></div>
          <div className="h-6 w-24 rounded-full bg-gray-300"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-12 rounded bg-gray-300"></div>
          <div className="h-4 w-12 rounded bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
};

export const InfinityThreadsList = ({
  data,
  height,
  fetchNextPage,
  isFetchingNextPage,
  announcementData,
}: {
  data: InfiniteData<TThread[], unknown> | undefined;
  height?: string;
  fetchNextPage: (
    options?: FetchNextPageOptions | undefined,
  ) => Promise<
    InfiniteQueryObserverResult<InfiniteData<TThread[], unknown>, Error>
  >;
  isFetchingNextPage: boolean;
  announcementData?: InfiniteData<TThread[], unknown>;
}) => {
  const postList = useRef(null);

  const onScroll = useCallback(() => {
    if (postList.current) {
      const { scrollTop, scrollHeight, clientHeight } = postList.current;
      // 距離底部 1200px 時就開始加載（更早觸發）
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 1200;

      if (isNearBottom && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [fetchNextPage, isFetchingNextPage]);

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

  return data && data.pages[0].length >= 1 ? (
    <div
      className="scrollbar-hide w-full overflow-y-auto"
      style={{ height }}
      ref={postList}
    >
      {/* Announcement Section */}
      {announcementData &&
        announcementData.pages[0].length >= 1 &&
        announcementData.pages.map((page: TThread[], _index: number) => {
          const currentDate = Date.now();
          const postDate = new Date(page[0].createdAt ?? "").getTime();
          const diffDays = Math.floor(
            (currentDate - postDate) / (1000 * 60 * 60 * 24),
          );

          if (diffDays < announcementStayTime) {
            return (
              <div key={page[0]._id} className="sm:col-span-2">
                <Thread threadData={page[0]} priority={true} />
              </div>
            );
          }
          return null;
        })}

      {/* Threads Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {data.pages.map((page: TThread[], pageIndex: number) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: paginated data has no unique page identifier
          <Fragment key={`page-${pageIndex}`}>
            {page.map((item, itemIndex) => {
              const sig = item.sig as unknown as Sig;
              const isAnnouncement = sig._id === announcementSigId;
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
    </div>
  ) : (
    <div className="flex h-full w-full items-center justify-center">
      <h1 className="text-2xl text-gray-600">No Post Yet</h1>
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

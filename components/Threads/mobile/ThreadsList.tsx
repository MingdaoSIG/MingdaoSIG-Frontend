import Link from "next/link";
import Image from "next/image";
import React, { Fragment, useCallback, useEffect, useRef } from "react";
import type {
  FetchNextPageOptions,
  InfiniteQueryObserverResult,
  InfiniteData,
} from "@tanstack/react-query";

// Interfaces, Types
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
import type { Sig } from "@/interfaces/Sig";

// Modules
import markdownToPlainText from "@/modules/markdownToPlainText";

// Configs
import { sigDefaultColors } from "../configs/sigDefaultColors";
import {
  announcementSigId,
  announcementStayTime,
} from "../configs/announcement";

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

const Thread = ({ threadData, priority = false }: { threadData: TThread; priority?: boolean }) => {
  const user = threadData.user as User;
  const sig = threadData.sig as Sig;
  const isAnnouncement = sig._id === announcementSigId;

  return (
    <Link
      href={`/post/${threadData._id}`}
      className={`block bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer select-none transition-all hover:bg-white/70 ${isAnnouncement ? "bg-white" : ""
        }`}
    >
      {/* Cover Image */}
      {threadData.cover && (
        <div className="relative w-full h-48 bg-gradient-to-b from-gray-100 to-gray-400">
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
      <div className="p-4 flex flex-col min-h-[200px]">
        {/* Header: User info and Date */}
        {!isAnnouncement && user && (
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-sm font-medium">
                {user?.name}
              </span>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: sigDefaultColors[sig._id!] || "#009BB0" }}
              >
                {sig.name}
              </span>
            </div>
            <div className="text-gray-500 text-sm">
              {new Date(threadData.createdAt!).toLocaleString("zh-TW").split(" ")[0]}
            </div>
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
          {isAnnouncement && "🔔 公告 - "}
          {threadData.title}
        </h2>

        {/* Content Preview - Dynamic lines based on hashtags */}
        <p
          className={`text-gray-700 text-sm leading-relaxed mb-3 ${isAnnouncement
              ? "line-clamp-3"
              : threadData.hashtag && threadData.hashtag.length > 0
                ? "line-clamp-2"
                : "line-clamp-4"
            }`}
        >
          {markdownToPlainText(threadData.content)}
        </p>

        {/* Hashtags - Horizontal scroll without scrollbar */}
        {threadData.hashtag && threadData.hashtag.length > 0 && !isAnnouncement && (
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
            {threadData.hashtag.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-[#5FCDF5] text-white rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
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
          <div className="flex items-center gap-4 text-gray-600 pt-2 mt-2">
            <div className="flex items-center gap-1.5">
              <Image
                src="/icons/likes.svg"
                alt="likes"
                width={18}
                height={18}
                className="opacity-60"
              />
              <span className="text-sm font-medium">{threadData.likes}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Image
                src="/icons/comments.svg"
                alt="comments"
                width={18}
                height={18}
                className="opacity-60"
              />
              <span className="text-sm font-medium">{threadData.comments}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

const ThreadSkeleton = () => {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden animate-pulse">
      {/* Cover Skeleton */}
      <div className="w-full h-48 bg-gradient-to-b from-gray-200 to-gray-300" />

      {/* Content Container */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-gray-300 rounded"></div>
            <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
          </div>
          <div className="h-4 w-20 bg-gray-300 rounded"></div>
        </div>
        <div className="h-6 w-3/4 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 w-full bg-gray-300 rounded mb-1"></div>
        <div className="h-4 w-full bg-gray-300 rounded mb-3"></div>
        <div className="flex gap-2 mb-3">
          <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
          <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
          <div className="h-6 w-24 bg-gray-300 rounded-full"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-12 bg-gray-300 rounded"></div>
          <div className="h-4 w-12 bg-gray-300 rounded"></div>
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
  data: any;
  height?: string;
  fetchNextPage: (
    options?: FetchNextPageOptions | undefined,
  ) => Promise<
    InfiniteQueryObserverResult<InfiniteData<TThread[], unknown>, Error>
  >;
  isFetchingNextPage: boolean;
  announcementData?: any;
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
    const listInnerElement: HTMLElement = postList.current!;

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
      className="w-full overflow-y-auto scrollbar-hide"
      style={{ height }}
      ref={postList}
    >
      {/* Announcement Section */}
      {announcementData &&
        announcementData.pages[0].length >= 1 &&
        announcementData.pages.map((page: TThread[], index: number) => {
          const currentDate = new Date().getTime();
          const postDate = new Date(page[0].createdAt!).getTime();
          const diffDays = Math.floor(
            (currentDate - postDate) / (1000 * 60 * 60 * 24),
          );

          if (diffDays < announcementStayTime) {
            return (
              <div key={index} className="sm:col-span-2">
                <Thread threadData={page[0]} priority={true} />
              </div>
            );
          }
        })}

      {/* Threads Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {data.pages.map((page: TThread[], pageIndex: number) => (
          <Fragment key={pageIndex}>
            {page.map((item, itemIndex) => {
              const sig = item.sig as Sig;
              const isAnnouncement = sig._id === announcementSigId;
              // Calculate global index for priority
              const globalIndex = pageIndex * page.length + itemIndex;
              const shouldPrioritize = globalIndex < 4;

              if (!isAnnouncement) {
                return <Thread threadData={item} priority={shouldPrioritize} key={itemIndex} />;
              }
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
    <div className="h-full w-full flex items-center justify-center">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {[...Array(repeat)].map((_, index) => (
          <ThreadSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};
"use client";

import { Hash } from "lucide-react";

import SplitBlock from "@/app/(Layout)/splitBlock";
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { TopTags } from "@/components/Tags/TopTags";
import {
  InfinityThreadsList as DesktopList,
  ThreadsListSkeleton as DesktopSkeleton,
} from "@/components/Threads/desktop/ThreadsList";
import {
  InfinityThreadsList as MobileList,
  ThreadsListSkeleton as MobileSkeleton,
} from "@/components/Threads/mobile/ThreadsList";
import useIsMobile from "@/utils/useIsMobile";
import { useHashtagPost } from "@/utils/usePost";

const PAGE_SIZE = 10;

/** Posts with one hashtag (/tag/[tag]), newest first. */
export default function TagPage({ tag }: { tag: string }) {
  const isMobile = useIsMobile();
  const query = useHashtagPost(tag, { pageSize: PAGE_SIZE });
  const { data, fetchNextPage, isFetchingNextPage, isLoading, error, refetch } =
    query;
  const emptyText = `還沒有標記 #${tag} 的貼文`;

  if (isMobile) {
    return (
      <div className="flex h-dvh flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <header className="flex shrink-0 items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-card">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700">
            <Hash size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-ink-500 text-xs">標籤</p>
            <h1 className="truncate font-bold text-ink-900 text-xl leading-7">
              #{tag}
            </h1>
          </div>
        </header>
        <div className="min-h-0 flex-1">
          <SectionErrorBoundary label="貼文列表">
            {isLoading ? (
              <MobileSkeleton repeat={4} height="100%" />
            ) : (
              <MobileList
                data={data}
                height="100%"
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
                error={error}
                onRetry={() => refetch()}
                emptyText={emptyText}
              />
            )}
          </SectionErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <SplitBlock>
      <div className="flex flex-col gap-4">
        <header className="flex items-center gap-4 rounded-card border border-line bg-surface px-6 py-5 shadow-card">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700">
            <Hash size={22} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-ink-500 text-sm">標籤</p>
            <h1 className="truncate font-bold text-2xl text-ink-900 leading-[1.4]">
              #{tag}
            </h1>
          </div>
        </header>
        <SectionErrorBoundary label="貼文列表">
          {isLoading ? (
            <DesktopSkeleton repeat={4} />
          ) : (
            <DesktopList
              data={data}
              fetchNextPage={fetchNextPage}
              isFetchingNextPage={isFetchingNextPage}
              error={error}
              onRetry={() => refetch()}
              emptyText={emptyText}
            />
          )}
        </SectionErrorBoundary>
      </div>
      <section className="glass shrink-0 rounded-card p-5">
        <h2 className="mb-3 font-bold text-base text-ink-900 leading-7">
          熱門標籤
        </h2>
        <TopTags current={tag} />
      </section>
    </SplitBlock>
  );
}

"use client";

//Components
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/desktop/ThreadsList";

// APIs Request Function
import { useAllPost, usePinnedPost, useSigPost } from "@/utils/usePost";

const ThreadsList = () => {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useAllPost({
      pageSize,
    });
  const { data: announcementData } = useSigPost("652d60b842cdf6a660c2b778", {
    pageSize: 1,
    sort: "latest",
  });
  // A failed pinned list just leaves the section out.
  const pinned = usePinnedPost();

  return (
    <div className="w-full">
      <SectionErrorBoundary label="貼文列表">
        {isLoading || pinned.isLoading ? (
          <ThreadsListSkeleton repeat={10} />
        ) : (
          <InfinityThreadsList
            data={data}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            announcementData={announcementData}
            pinnedData={pinned.data}
            error={error}
            onRetry={() => refetch()}
          />
        )}
      </SectionErrorBoundary>
    </div>
  );
};

export default ThreadsList;

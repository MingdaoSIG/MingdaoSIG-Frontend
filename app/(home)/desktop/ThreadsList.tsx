"use client";

//Components
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/desktop/ThreadsList";

// APIs Request Function
import { useAllPost, useSigPost } from "@/utils/usePost";

const ThreadsList = () => {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useAllPost({
    pageSize,
  });
  const { data: announcementData } = useSigPost("652d60b842cdf6a660c2b778", {
    pageSize: 1,
    sort: "latest",
  });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {isLoading ? (
        <ThreadsListSkeleton repeat={10} height="auto" />
      ) : (
        <InfinityThreadsList
          data={data}
          height="70dvh"
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          announcementData={announcementData}
        />
      )}
    </div>
  );
};

export default ThreadsList;
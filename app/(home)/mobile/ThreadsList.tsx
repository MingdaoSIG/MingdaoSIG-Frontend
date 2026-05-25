"use client";
import { useEffect, useState } from "react";

// Components
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/mobile/ThreadsList";
// Interfaces
import { useAllPost, useSigPost } from "@/utils/usePost";
import SwitchButton from "./ButtonTools";
import SigList from "./SigList";

const ThreadsList = () => {
  const [showList, setShowList] = useState(false);
  const [dataType, setDataType] = useState("latest");
  const pageSize = 10;

  const { data, fetchNextPage, isFetchingNextPage, isLoading, refetch } =
    useAllPost({
      pageSize,
      sort: dataType,
    });

  const { data: announcementData } = useSigPost("652d60b842cdf6a660c2b778", {
    pageSize: 1,
    sort: "latest",
  });

  async function switchListType(index: number) {
    if (index === 0) {
      setDataType("top");
    } else if (index === 1) {
      setDataType("latest");
    }
  }

  useEffect(() => {
    const onScrollToTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      refetch();
    };
    window.addEventListener("mobile:scroll-to-top", onScrollToTop);
    return () => {
      window.removeEventListener("mobile:scroll-to-top", onScrollToTop);
    };
  }, [refetch]);

  return (
    <PullToRefresh
      onRefresh={async () => {
        await refetch();
      }}
      disabled={isFetchingNextPage}
      className="scrollbar-hide relative mx-auto h-auto w-full max-w-7xl overflow-y-auto px-2 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))] sm:px-4 md:px-6 lg:px-8"
    >
      <SigList open={showList} onClose={() => setShowList(false)} />

      <SwitchButton
        switchCallback={switchListType}
        sigListCallback={setShowList}
      />

      {isLoading ? (
        <ThreadsListSkeleton repeat={10} height="auto" />
      ) : (
        <InfinityThreadsList
          data={data}
          height="calc(100dvh - 12rem)"
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          announcementData={announcementData}
        />
      )}
    </PullToRefresh>
  );
};

export default ThreadsList;

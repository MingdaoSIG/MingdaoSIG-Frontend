"use client";
import { useCallback, useEffect, useState } from "react";

// Components
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/mobile/ThreadsList";
// Interfaces
import {
  useAllPost,
  useHotPostList,
  useMySigPost,
  usePinnedPost,
  useSigPost,
} from "@/utils/usePost";
import { useUserAccount } from "@/utils/useUserAccount";
import { MySigEmpty } from "../MySigEmpty";
import { useHomeFeed } from "../useHomeFeed";
import SwitchButton from "./ButtonTools";
import SigList from "./SigList";

const ThreadsList = () => {
  const [showList, setShowList] = useState(false);
  const { userData, isLoading: accountLoading } = useUserAccount();
  const { feed, setFeed, showMySig } = useHomeFeed();
  const pageSize = 10;

  // 熱門 is the hot-post list (last 30 days, widening when that is thin).
  const latest = useAllPost({ pageSize, sort: "latest" });
  const hot = useHotPostList({ pageSize }, feed === "top");
  // 我的 SIG: posts of the SIGs the user is in or manages (logged in).
  const mySig = useMySigPost(
    userData?._id ?? "",
    { pageSize },
    feed === "mysig",
  );
  const isMySig = feed === "mysig";
  const active = feed === "top" ? hot : isMySig ? mySig : latest;
  const { data, fetchNextPage, isFetchingNextPage, isLoading, error } = active;
  const mySigEmpty =
    isMySig &&
    !error &&
    !isLoading &&
    (data?.pages ?? []).every((page) => page.length === 0);
  // A failed pinned list just leaves the section out.
  const pinned = usePinnedPost();
  const refetchActive = active.refetch;
  const refetchPinned = pinned.refetch;
  const refetch = useCallback(async () => {
    await Promise.all([refetchActive(), refetchPinned()]);
  }, [refetchActive, refetchPinned]);

  const { data: announcementData } = useSigPost("652d60b842cdf6a660c2b778", {
    pageSize: 1,
    sort: "latest",
  });

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
        value={feed}
        onChange={setFeed}
        showMySig={showMySig}
        sigListCallback={setShowList}
      />

      <SectionErrorBoundary label="貼文列表">
        {isLoading ||
        (isMySig && accountLoading) ||
        (!isMySig && pinned.isLoading) ? (
          <ThreadsListSkeleton repeat={10} height="auto" />
        ) : mySigEmpty ? (
          <MySigEmpty mobile onBrowseSigs={() => setShowList(true)} />
        ) : (
          <InfinityThreadsList
            data={data}
            height="calc(100dvh - 12.5rem)"
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            announcementData={isMySig ? undefined : announcementData}
            pinnedData={isMySig ? undefined : pinned.data}
            error={error}
            onRetry={() => refetch()}
          />
        )}
      </SectionErrorBoundary>
    </PullToRefresh>
  );
};

export default ThreadsList;

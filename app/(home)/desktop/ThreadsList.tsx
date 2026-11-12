"use client";

//Components
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/desktop/ThreadsList";

// APIs Request Function
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
import { FeedTabs } from "./FeedTabs";

const ThreadsList = () => {
  const pageSize = 10;
  const { userData, isLoading: accountLoading } = useUserAccount();
  const { feed, setFeed, showMySig } = useHomeFeed();

  const latest = useAllPost({ pageSize });
  // 熱門 is the hot-post list (last 30 days, widening when that is thin).
  const hot = useHotPostList({ pageSize }, feed === "top");
  // 我的 SIG: posts of the SIGs the user is in or manages (logged in).
  const mySig = useMySigPost(
    userData?._id ?? "",
    { pageSize },
    feed === "mysig",
  );
  const active = feed === "top" ? hot : feed === "mysig" ? mySig : latest;
  const { data, fetchNextPage, isFetchingNextPage, isLoading, error, refetch } =
    active;

  const { data: announcementData } = useSigPost("652d60b842cdf6a660c2b778", {
    pageSize: 1,
    sort: "latest",
  });
  // A failed pinned list just leaves the section out.
  const pinned = usePinnedPost();
  const isMySig = feed === "mysig";
  const mySigEmpty =
    isMySig &&
    !error &&
    !isLoading &&
    (data?.pages ?? []).every((page) => page.length === 0);

  return (
    <div className="w-full">
      <FeedTabs value={feed} onChange={setFeed} showMySig={showMySig} />
      <SectionErrorBoundary label="貼文列表">
        {isLoading ||
        (isMySig && accountLoading) ||
        (!isMySig && pinned.isLoading) ? (
          <ThreadsListSkeleton repeat={10} />
        ) : mySigEmpty ? (
          <MySigEmpty />
        ) : (
          <InfinityThreadsList
            data={data}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            announcementData={isMySig ? undefined : announcementData}
            pinnedData={isMySig ? undefined : pinned.data}
            error={error}
            onRetry={() => refetch()}
          />
        )}
      </SectionErrorBoundary>
    </div>
  );
};

export default ThreadsList;

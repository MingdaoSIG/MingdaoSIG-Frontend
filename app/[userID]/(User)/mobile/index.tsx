import dynamic from "next/dynamic";
import type { Dispatch, SetStateAction } from "react";
// Components
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/mobile/ThreadsList";
import type { Sig } from "@/interfaces/Sig";
// Interfaces
import type { User } from "@/interfaces/User";
// Hooks
import {
  useBookmarkedPost,
  useSigPost,
  useUserLikedPost,
  useUserPost,
} from "@/utils/usePost";
import {
  type ProfileTab,
  ProfileTabs,
  useProfileTabs,
} from "../components/ProfileTabs";
import { SigSections } from "../components/SigSections";
import Info from "./info";
// Styles
import styles from "./mobile.module.scss";

const StatsTab = dynamic(() => import("../components/StatsTab"));
const SeriesTab = dynamic(() => import("../components/SeriesTab"));

// The list fills what the profile card leaves (the card's height depends
// on the bio and the join button, so a fixed estimate ran under the tab
// bar); a long card leaves it at least half a screen and the page scrolls.
const LIST_HEIGHT = "100%";

// Renders the profile the page already fetched (it used to fetch it a
// second time and, on failure, render a post list for an empty id).
export default function ProfileMobile({
  data,
  dataType,
  isLoading,
  setData,
  isOwn,
  tab,
  setTab,
}: {
  data: User | Sig | null;
  dataType: "user" | "sig" | null;
  isLoading: boolean;
  setData: Dispatch<SetStateAction<User | Sig | null>>;
  /** Your own profile: shows 按讚過的貼文, 收藏, 系列 and 我的數據. */
  isOwn: boolean;
  tab: ProfileTab;
  setTab: (tab: ProfileTab) => void;
}) {
  const id = data?._id ?? "";
  const tabs = useProfileTabs(dataType, id, isOwn);
  const current = tabs.includes(tab) ? tab : "posts";
  // Series and stats are cards, not a scrolling post list.
  const panel = current === "series" || current === "stats";

  return (
    <div className={styles.mobileProfile}>
      <Info
        user={data}
        isLoading={isLoading}
        dataType={dataType}
        setInfo={setData}
      />
      {tabs.length > 0 && (
        <div className="mx-[0.5rem] mb-2">
          <ProfileTabs value={current} onChange={setTab} tabs={tabs} mobile />
        </div>
      )}
      <div
        className={`mx-[0.5rem] min-h-[50dvh] flex-1 ${
          panel ? "pb-4" : "overflow-y-hidden"
        }`}
      >
        <SectionErrorBoundary label="貼文列表">
          {isLoading || !id ? (
            <ThreadsListSkeleton repeat={6} height={LIST_HEIGHT} />
          ) : current === "liked" ? (
            <LikedInfinityThreadList id={id} />
          ) : current === "bookmarks" ? (
            <BookmarkInfinityThreadList id={id} />
          ) : current === "series" ? (
            <SeriesTab userId={id} isOwn={isOwn} mobile />
          ) : current === "stats" ? (
            <StatsTab mobile />
          ) : dataType === "user" ? (
            <UserInfinityThreadList id={id} />
          ) : (
            <SigSections
              sig={data as Sig}
              posts={<SIGInfinityThreadList id={id} />}
              variant="mobile"
            />
          )}
        </SectionErrorBoundary>
      </div>
    </div>
  );
}

function UserInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useUserPost(id, { pageSize });

  return isLoading ? (
    <ThreadsListSkeleton repeat={6} height={LIST_HEIGHT} />
  ) : (
    <InfinityThreadsList
      data={data}
      height={LIST_HEIGHT}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      error={error}
      onRetry={() => refetch()}
    />
  );
}

function BookmarkInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useBookmarkedPost(id, { pageSize });

  return isLoading ? (
    <ThreadsListSkeleton repeat={6} height={LIST_HEIGHT} />
  ) : (
    <InfinityThreadsList
      data={data}
      height={LIST_HEIGHT}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      error={error}
      onRetry={() => refetch()}
      emptyText="還沒有收藏的貼文"
    />
  );
}

function LikedInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useUserLikedPost(id, { pageSize });

  return isLoading ? (
    <ThreadsListSkeleton repeat={6} height={LIST_HEIGHT} />
  ) : (
    <InfinityThreadsList
      data={data}
      height={LIST_HEIGHT}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      error={error}
      onRetry={() => refetch()}
      emptyText="還沒有按讚過的貼文"
    />
  );
}

function SIGInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useSigPost(id, { pageSize });

  return isLoading ? (
    <ThreadsListSkeleton repeat={6} height={LIST_HEIGHT} />
  ) : (
    <InfinityThreadsList
      data={data}
      height={LIST_HEIGHT}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      error={error}
      onRetry={() => refetch()}
    />
  );
}

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
import { useSigPost, useUserLikedPost, useUserPost } from "@/utils/usePost";
import { type ProfileTab, ProfileTabs } from "../components/ProfileTabs";
import { SigSections } from "../components/SigSections";
import Info from "./info";
// Styles
import styles from "./mobile.module.scss";

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
  /** Your own profile: shows the 「按讚過的貼文」 tab. */
  isOwn: boolean;
  tab: ProfileTab;
  setTab: (tab: ProfileTab) => void;
}) {
  const id = data?._id ?? "";
  const showLiked = isOwn && tab === "liked";

  return (
    <div className={styles.mobileProfile}>
      <Info
        user={data}
        isLoading={isLoading}
        dataType={dataType}
        setInfo={setData}
      />
      {isOwn && (
        <div className="mx-[0.5rem] mb-2">
          <ProfileTabs value={tab} onChange={setTab} mobile />
        </div>
      )}
      <div className="mx-[0.5rem] min-h-[50dvh] flex-1 overflow-y-hidden">
        <SectionErrorBoundary label="貼文列表">
          {isLoading || !id ? (
            <ThreadsListSkeleton repeat={6} height={LIST_HEIGHT} />
          ) : showLiked ? (
            <LikedInfinityThreadList id={id} />
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

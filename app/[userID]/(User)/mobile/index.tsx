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
import { useSigPost, useUserPost } from "@/utils/usePost";
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
}: {
  data: User | Sig | null;
  dataType: "user" | "sig" | null;
  isLoading: boolean;
  setData: Dispatch<SetStateAction<User | Sig | null>>;
}) {
  const id = data?._id ?? "";

  return (
    <div className={styles.mobileProfile}>
      <Info
        user={data}
        isLoading={isLoading}
        dataType={dataType}
        setInfo={setData}
      />
      <div className="mx-[0.5rem] min-h-[50dvh] flex-1 overflow-y-hidden">
        <SectionErrorBoundary label="貼文列表">
          {isLoading || !id ? (
            <ThreadsListSkeleton repeat={6} height={LIST_HEIGHT} />
          ) : dataType === "user" ? (
            <UserInfinityThreadList id={id} />
          ) : (
            <SIGInfinityThreadList id={id} />
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

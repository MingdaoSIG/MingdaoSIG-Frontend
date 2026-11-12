"use client";

import { useEffect, useState } from "react";
import SplitBlock from "@/app/(Layout)/splitBlock";
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { NotFound } from "@/components/NotFound";
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/desktop/ThreadsList";
import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import { apiRequest } from "@/modules/api/client";
import useIsMobile from "@/utils/useIsMobile";
import { useSigPost, useUserLikedPost, useUserPost } from "@/utils/usePost";
import { useUserAccount } from "@/utils/useUserAccount";
import { type ProfileTab, ProfileTabs } from "./components/ProfileTabs";
import { SigSections } from "./components/SigSections";
import Info from "./desktop/Info";
import ProfileMobile from "./mobile";

type AccountData = {
  data: User | Sig | null;
  dataType: "user" | "sig" | null;
  /** Set when the lookup failed for a reason other than "not found". */
  error: string | null;
};

export default function UserPage({ accountId }: { accountId: string }) {
  const isMobile = useIsMobile();
  const { userData } = useUserAccount();
  const [tab, setTab] = useState<ProfileTab>("posts");

  const [isLoading, setIsLoading] = useState(true);
  const [dataType, setDataType] = useState<"user" | "sig" | null>(null);
  const [data, setData] = useState<User | Sig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // `attempt` re-runs the lookup when the user presses retry.
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setIsLoading(true);
      setError(null);
      const result = await getAccountData(accountId, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setData(result.data);
      setDataType(result.dataType);
      setError(result.error);
      setIsLoading(false);
    })();

    return () => controller.abort();
  }, [accountId, attempt]);

  if (!isLoading && dataType === null) {
    if (error) {
      return (
        <div
          role="alert"
          className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-ink-700"
        >
          <p>{error}</p>
          <button
            type="button"
            className="cursor-pointer rounded-control border border-line bg-surface px-4 py-2 text-sm hover:bg-field"
            onClick={() => setAttempt((n) => n + 1)}
          >
            重試
          </button>
        </div>
      );
    }
    return (
      <NotFound
        content={{
          message: "找不到這個使用者或 SIG",
        }}
        image={{
          show: false,
        }}
      />
    );
  }

  // The profile is fetched once, here; the mobile view gets it as props.
  if (isMobile) {
    return (
      <ProfileMobile
        data={data}
        dataType={dataType}
        isLoading={isLoading}
        setData={setData}
        isOwn={
          dataType === "user" &&
          Boolean(data?._id) &&
          userData?._id === data?._id
        }
        tab={tab}
        setTab={setTab}
      />
    );
  }

  const id = data?._id ?? "";
  // Only your own profile has the 「按讚過的貼文」 tab.
  const isOwn = dataType === "user" && Boolean(id) && userData?._id === id;
  const showLiked = isOwn && tab === "liked";
  return (
    <SplitBlock>
      <div className="flex flex-col gap-4">
        {isOwn && <ProfileTabs value={tab} onChange={setTab} />}
        <SectionErrorBoundary label="貼文列表">
          {isLoading || !id ? (
            <ThreadsListSkeleton repeat={6} />
          ) : showLiked ? (
            <LikedInfinityThreadList id={id} />
          ) : dataType === "user" ? (
            <UserInfinityThreadList id={id} />
          ) : (
            <SigSections
              sig={data as Sig}
              posts={<SIGInfinityThreadList id={id} />}
            />
          )}
        </SectionErrorBoundary>
      </div>
      <Info
        user={data}
        isLoading={isLoading}
        dataType={dataType}
        setInfo={setData}
      />
    </SplitBlock>
  );
}

function UserInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useUserPost(id, { pageSize });

  return isLoading ? (
    <ThreadsListSkeleton repeat={6} />
  ) : (
    <InfinityThreadsList
      data={data}
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
    <ThreadsListSkeleton repeat={6} />
  ) : (
    <InfinityThreadsList
      data={data}
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
    <ThreadsListSkeleton repeat={6} />
  ) : (
    <InfinityThreadsList
      data={data}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      error={error}
      onRetry={() => refetch()}
    />
  );
}

function isAccount(value: unknown): value is User | Sig {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as User)._id === "string"
  );
}

/** Looks the id up as a user and as a SIG at the same time. */
async function getAccountData(
  accountId: string,
  signal: AbortSignal,
): Promise<AccountData> {
  // accountId is validated (`@` + [a-z0-9_.-]), so it is safe in the path;
  // it must not be encoded, or `/user/@:id` stops matching.
  const [user, sig] = await Promise.all([
    apiRequest<User>(`/user/${accountId}`, { signal }),
    apiRequest<Sig>(`/sig/${accountId}`, { signal }),
  ]);

  if (user.ok && isAccount(user.data)) {
    return { data: user.data, dataType: "user", error: null };
  }
  if (sig.ok && isAccount(sig.data)) {
    return { data: sig.data, dataType: "sig", error: null };
  }
  for (const result of [user, sig]) {
    if (!result.ok && result.kind !== "not-found") {
      return { data: null, dataType: null, error: result.message };
    }
  }
  return { data: null, dataType: null, error: null };
}

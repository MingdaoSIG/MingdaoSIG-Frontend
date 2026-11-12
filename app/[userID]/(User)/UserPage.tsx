"use client";

import dynamic from "next/dynamic";
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
import {
  useBookmarkedPost,
  useSigPost,
  useUserLikedPost,
  useUserPost,
} from "@/utils/usePost";
import { useUserAccount } from "@/utils/useUserAccount";
import {
  isProfileTab,
  type ProfileTab,
  ProfileTabs,
  useProfileTabs,
} from "./components/ProfileTabs";
import { SigSections } from "./components/SigSections";
import Info from "./desktop/Info";
import ProfileMobile from "./mobile";

// Charts and the series manager load only when their tab opens.
const StatsTab = dynamic(() => import("./components/StatsTab"));
const SeriesTab = dynamic(() => import("./components/SeriesTab"));

/** `?tab=` picks the first tab, so a link can open 系列 or 收藏. */
function initialTab(): ProfileTab {
  if (typeof window === "undefined") {
    return "posts";
  }
  const value = new URLSearchParams(window.location.search).get("tab");
  return isProfileTab(value) ? value : "posts";
}

/** Keeps `?tab=` in the address bar without a navigation. */
function rememberTab(tab: ProfileTab) {
  const url = new URL(window.location.href);
  if (tab === "posts") {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", tab);
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

type AccountData = {
  data: User | Sig | null;
  dataType: "user" | "sig" | null;
  /** Set when the lookup failed for a reason other than "not found". */
  error: string | null;
};

export default function UserPage({ accountId }: { accountId: string }) {
  const isMobile = useIsMobile();
  const { userData } = useUserAccount();
  const [tab, setTabState] = useState<ProfileTab>(initialTab);
  const setTab = (next: ProfileTab) => {
    setTabState(next);
    rememberTab(next);
  };

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

  return (
    <SplitBlock>
      <DesktopProfileMain
        id={data?._id ?? ""}
        dataType={dataType}
        isLoading={isLoading}
        isOwn={
          dataType === "user" &&
          Boolean(data?._id) &&
          userData?._id === data?._id
        }
        tab={tab}
        setTab={setTab}
        sig={dataType === "sig" ? (data as Sig | null) : null}
      />
      <Info
        user={data}
        isLoading={isLoading}
        dataType={dataType}
        setInfo={setData}
      />
    </SplitBlock>
  );
}

function DesktopProfileMain({
  id,
  dataType,
  isLoading,
  isOwn,
  tab,
  setTab,
  sig,
}: {
  id: string;
  dataType: "user" | "sig" | null;
  isLoading: boolean;
  isOwn: boolean;
  tab: ProfileTab;
  setTab: (tab: ProfileTab) => void;
  /** The SIG on a SIG page: 精選成果 and 貼文 / 活動. */
  sig: Sig | null;
}) {
  const tabs = useProfileTabs(dataType, id, isOwn);
  const current = tabs.includes(tab) ? tab : "posts";
  return (
    <div className="flex flex-col gap-4">
      {tabs.length > 0 && (
        <ProfileTabs value={current} onChange={setTab} tabs={tabs} />
      )}
      <SectionErrorBoundary label="貼文列表">
        {isLoading || !id ? (
          <ThreadsListSkeleton repeat={6} />
        ) : current === "liked" ? (
          <LikedInfinityThreadList id={id} />
        ) : current === "bookmarks" ? (
          <BookmarkInfinityThreadList id={id} />
        ) : current === "series" ? (
          <SeriesTab userId={id} isOwn={isOwn} />
        ) : current === "stats" ? (
          <StatsTab />
        ) : dataType === "user" ? (
          <UserInfinityThreadList id={id} />
        ) : sig ? (
          <SigSections sig={sig} posts={<SIGInfinityThreadList id={id} />} />
        ) : (
          <SIGInfinityThreadList id={id} />
        )}
      </SectionErrorBoundary>
    </div>
  );
}

function BookmarkInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useBookmarkedPost(id, { pageSize });

  return isLoading ? (
    <ThreadsListSkeleton repeat={6} />
  ) : (
    <InfinityThreadsList
      data={data}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      error={error}
      onRetry={() => refetch()}
      emptyText="還沒有收藏的貼文。在貼文上按書籤圖示即可收藏。"
    />
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

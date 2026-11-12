"use client";

import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { NotFound } from "@/components/NotFound";
import { InfiniteThreadList } from "@/components/PostCard/InfiniteThreadList";
import { postListFetcher } from "@/components/PostCard/postListFetcher";
import { announcementSigId } from "@/components/Threads/configs/announcement";
import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import { BRAND_COLOR } from "@/modules/sigTheme";
import { useSigColor } from "@/modules/sigTheme/useSigColor";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
import {
  isProfileTab,
  type ProfileTab,
  ProfileTabs,
  useProfileTabs,
} from "./components/ProfileTabs";
import { type AccountKind, lookupAccount } from "./lookup";
import { SigPanel } from "./panel/SigPanel";
import { isSigTab, SigContent, type SigTab, SigTabBar } from "./panel/SigTabs";
import { UserPanel } from "./panel/UserPanel";

// `/@<id>`: a SIG page or a public profile, one layout for both (owner
// decision 2026-11-12, v4 4A). Desktop: tabs above an infinite list in a
// single column (about 52rem), and a wider info panel on the right that
// sticks under the header. Phones: no right column; the panel is a card
// at the top that shrinks to a strip once the list is scrolled, then the
// tabs and the list. `?tab=` opens a tab; old ids redirect (`redirectTo`).

const StatsTab = dynamic(() => import("./components/StatsTab"));
const SeriesTab = dynamic(() => import("./components/SeriesTab"));

function readTab(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return new URLSearchParams(window.location.search).get("tab");
}

/** Keeps `?tab=` in the address bar without a navigation. */
function rememberTab(tab: string) {
  const url = new URL(window.location.href);
  if (tab === "posts") {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", tab);
  }
  window.history.replaceState(window.history.state, "", url.toString());
}

const emptyList = (text: string) => (
  <p className="rounded-card border border-line border-dashed bg-surface/60 px-6 py-12 text-center text-ink-500 text-sm">
    {text}
  </p>
);

function UserList({
  path,
  queryKey,
  auth = false,
  empty,
  label,
}: {
  path: string;
  queryKey: string[];
  auth?: boolean;
  empty: string;
  label: string;
}) {
  const fetchPage = useMemo(
    () => postListFetcher(path, {}, auth),
    [path, auth],
  );
  return (
    <InfiniteThreadList
      fetchPage={fetchPage}
      queryKey={queryKey}
      label={label}
      empty={emptyList(empty)}
    />
  );
}

function ProfileContent({
  user,
  tab,
  own,
  mobile,
}: {
  user: User;
  tab: ProfileTab;
  own: boolean;
  mobile: boolean;
}) {
  const id = user._id ?? "";
  switch (tab) {
    case "liked":
      return (
        <UserList
          path={`/post/list/user/${id}/like`}
          queryKey={["userLiked", id]}
          empty="還沒有按讚過的貼文"
          label="按讚過的貼文"
        />
      );
    case "bookmarks":
      return (
        <UserList
          path="/user/me/bookmarks"
          queryKey={["myBookmarks", id]}
          auth
          empty="還沒有收藏的貼文。在貼文上按書籤圖示即可收藏。"
          label="收藏"
        />
      );
    case "series":
      return <SeriesTab userId={id} isOwn={own} mobile={mobile} />;
    case "stats":
      return <StatsTab mobile={mobile} />;
    default:
      return (
        <UserList
          path={`/post/list/user/${id}`}
          queryKey={["userPosts", id]}
          empty="還沒有貼文"
          label={`${user.name || user.customId} 的貼文`}
        />
      );
  }
}

/** The page's two parts, whichever kind the account is. */
function useAccountView({
  data,
  dataType,
  setData,
  mobile,
  compact,
}: {
  data: User | Sig;
  dataType: AccountKind;
  setData: (data: User | Sig) => void;
  mobile: boolean;
  compact: boolean;
}): { panel: ReactNode; tabs: ReactNode; content: ReactNode } {
  const { userData } = useUserAccount();
  const colorOf = useSigColor();
  const isSig = dataType === "sig";
  const own = !isSig && Boolean(data._id) && userData?._id === data._id;
  const profileTabs = useProfileTabs(dataType, data._id ?? "", own);
  const initial = readTab();
  const [sigTab, setSigTab] = useState<SigTab>(
    isSigTab(initial) ? initial : "posts",
  );
  const [profileTab, setProfileTab] = useState<ProfileTab>(
    isProfileTab(initial) ? initial : "posts",
  );

  if (isSig) {
    const sig = data as Sig;
    const plain = sig._id === announcementSigId;
    const changeTab = (tab: SigTab) => {
      setSigTab(tab);
      rememberTab(tab);
    };
    return {
      panel: (
        <SigPanel
          sig={sig}
          setSig={setData}
          onTab={changeTab}
          compact={compact}
        />
      ),
      // The announcement SIG is only a channel: its posts, nothing else.
      tabs: plain ? null : (
        <SigTabBar
          value={sigTab}
          onChange={changeTab}
          color={colorOf(sig, BRAND_COLOR) ?? BRAND_COLOR}
          mobile={mobile}
        />
      ),
      content: (
        <SigContent sig={sig} tab={plain ? "posts" : sigTab} mobile={mobile} />
      ),
    };
  }

  const user = data as User;
  const current = profileTabs.includes(profileTab) ? profileTab : "posts";
  return {
    panel: (
      <UserPanel user={user} setUser={setData} own={own} compact={compact} />
    ),
    tabs:
      profileTabs.length > 0 ? (
        <ProfileTabs
          value={current}
          onChange={(tab) => {
            setProfileTab(tab);
            rememberTab(tab);
          }}
          tabs={profileTabs}
          mobile={mobile}
        />
      ) : null,
    content: (
      <ProfileContent user={user} tab={current} own={own} mobile={mobile} />
    ),
  };
}

function DesktopView(props: {
  data: User | Sig;
  dataType: AccountKind;
  setData: (data: User | Sig) => void;
}) {
  const view = useAccountView({ ...props, mobile: false, compact: false });
  return (
    <div className="mx-auto grid w-[min(100%-3rem,78rem)] grid-cols-[minmax(0,1fr)_20rem] items-start justify-center gap-8 min-[1280px]:grid-cols-[minmax(0,52rem)_23rem]">
      <div className="flex min-w-0 flex-col gap-4" data-account-main>
        {view.tabs}
        <SectionErrorBoundary label="貼文列表">
          {view.content}
        </SectionErrorBoundary>
      </div>
      <aside
        data-shell="aside"
        aria-label="資訊"
        className="custom-scrollbar sticky top-[var(--shell-top,5.5rem)] max-h-[calc(100dvh-var(--shell-top,5.5rem)-1.5rem)] min-w-0 overflow-y-auto overflow-x-hidden"
        data-account-panel
      >
        {view.panel}
      </aside>
    </div>
  );
}

function MobileView(props: {
  data: User | Sig;
  dataType: AccountKind;
  setData: (data: User | Sig) => void;
}) {
  // The card shrinks to a strip once the list is scrolled, and comes back
  // at the top.
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const view = useAccountView({ ...props, mobile: true, compact: collapsed });
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const onScroll = () => {
      setCollapsed((was) => (was ? el.scrollTop > 8 : el.scrollTop > 48));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="flex h-full flex-col px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <div
        ref={scrollRef}
        className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4"
        data-account-scroll
      >
        <div
          className={`z-10 shrink-0 ${collapsed ? "sticky top-0" : ""}`}
          data-account-card={collapsed ? "collapsed" : "open"}
        >
          {view.panel}
        </div>
        {view.tabs && (
          <div className={`shrink-0 bg-canvas ${collapsed ? "" : ""}`}>
            {view.tabs}
          </div>
        )}
        <SectionErrorBoundary label="貼文列表">
          {view.content}
        </SectionErrorBoundary>
      </div>
    </div>
  );
}

function PageSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <div
      aria-busy="true"
      className={
        mobile
          ? "flex animate-pulse flex-col gap-3 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))]"
          : "mx-auto grid w-[min(100%-3rem,78rem)] animate-pulse grid-cols-[minmax(0,1fr)_20rem] items-start gap-8 min-[1280px]:grid-cols-[minmax(0,52rem)_23rem]"
      }
    >
      <span className="sr-only">載入中…</span>
      {mobile && <div className="h-56 rounded-card bg-surface shadow-card" />}
      <div className="flex flex-col gap-3">
        <div className="h-10 rounded-control bg-surface/70" />
        <div className="h-28 rounded-card bg-surface shadow-card" />
        <div className="h-28 rounded-card bg-surface shadow-card" />
      </div>
      {!mobile && <div className="h-96 rounded-card bg-surface shadow-card" />}
    </div>
  );
}

export default function UserPage({ accountId }: { accountId: string }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const client = useQueryClient();
  const [state, setState] = useState<{
    loading: boolean;
    data: User | Sig | null;
    dataType: AccountKind | null;
    error: string | null;
  }>({ loading: true, data: null, dataType: null, error: null });
  const [attempt, setAttempt] = useState(0);

  // `attempt` re-runs the lookup when the user presses retry.
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setState((current) => ({ ...current, loading: true, error: null }));
      const result = await lookupAccount(accountId, client, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      // An old link: go to the current address, keeping ?tab= and #…,
      // and stay on the skeleton until that page loads.
      if (result.redirectTo) {
        const { search, hash } = window.location;
        router.replace(`/@${result.redirectTo}${search}${hash}`);
        return;
      }
      setState({
        loading: false,
        data: result.data,
        dataType: result.dataType,
        error: result.error,
      });
    })();
    return () => controller.abort();
  }, [accountId, attempt]);

  if (state.loading) {
    return <PageSkeleton mobile={isMobile} />;
  }
  if (!state.data || !state.dataType) {
    if (state.error) {
      return (
        <div
          role="alert"
          className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-ink-700"
        >
          <p>{state.error}</p>
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
        content={{ message: "找不到這個使用者或 SIG" }}
        image={{ show: false }}
      />
    );
  }

  const props = {
    data: state.data,
    dataType: state.dataType,
    setData: (data: User | Sig) =>
      setState((current) => ({ ...current, data })),
  };
  // Keyed by account: another profile starts on its own tabs.
  return isMobile ? (
    <MobileView key={state.data._id} {...props} />
  ) : (
    <DesktopView key={state.data._id} {...props} />
  );
}

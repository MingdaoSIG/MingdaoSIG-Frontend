"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import {
  InfiniteThreadList,
  type ThreadListQuery,
  useThreadPages,
} from "@/components/PostCard/InfiniteThreadList";
import { PostCard, PostCardSkeleton } from "@/components/PostCard/PostCard";
import { isAnnouncementPost } from "@/components/PostCard/post";
import { postListFetcher } from "@/components/PostCard/postListFetcher";
import {
  announcementSigId,
  announcementStayTime,
} from "@/components/Threads/configs/announcement";
import type { TThread } from "@/interfaces/Thread";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import { ANNOUNCEMENT_SIG_ID, useSigDirectory } from "@/utils/useAdminAccess";
import { useMySigs } from "@/utils/useMySigs";
import { useHotPostList, usePinnedPost, useSigPost } from "@/utils/usePost";
import { useUserAccount } from "@/utils/useUserAccount";
import { MySigEmpty } from "./MySigEmpty";
import { type HomeFeed as FeedTab, useHomeFeed } from "./useHomeFeed";

// The home feed (decision 3A): tabs 我的 SIG / 最新 / 熱門, SIG filter
// chips, pinned posts on top, compact cards in an infinite list. Desktop
// and phones share it; the desktop right column is HomeRail.

const PAGE_SIZE = 10;

const TABS: { value: FeedTab; label: string }[] = [
  { value: "mysig", label: "我的 SIG" },
  { value: "latest", label: "最新" },
  { value: "top", label: "熱門" },
];

const notAnnouncement = (post: TThread) => !isAnnouncementPost(post);

function FeedTabs({
  value,
  onChange,
  showMySig,
  mobile,
}: {
  value: FeedTab;
  onChange: (value: FeedTab) => void;
  showMySig: boolean;
  mobile: boolean;
}) {
  const tabs = TABS.filter((tab) => showMySig || tab.value !== "mysig");
  return (
    <div
      role="tablist"
      aria-label="首頁貼文"
      className="flex w-fit shrink-0 select-none gap-0.5 rounded-control border border-line bg-surface p-0.5 shadow-card"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-feed-tab={tab.value}
            onClick={() => onChange(tab.value)}
            className={`cursor-pointer whitespace-nowrap rounded-[6px] px-4 font-semibold text-sm transition-colors ${
              mobile ? "h-10" : "h-9"
            } ${active ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-field"}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function SigChips({
  sigs,
  value,
  onChange,
  mobile,
}: {
  sigs: { _id: string; name: string; color?: string }[];
  value: string;
  onChange: (value: string) => void;
  mobile: boolean;
}) {
  if (sigs.length === 0) {
    return null;
  }
  const chip = (
    id: string,
    label: string,
    color: string | undefined,
    title?: string,
  ) => {
    const active = value === id;
    return (
      <li key={id || "all"} className="shrink-0">
        <button
          type="button"
          aria-pressed={active}
          title={title}
          data-sig-chip={id || "all"}
          onClick={() => onChange(id)}
          className={`flex max-w-[11rem] cursor-pointer items-center gap-1.5 rounded-full border px-3 font-semibold text-sm transition-colors ${
            mobile ? "h-9" : "h-8"
          } ${
            active
              ? "border-brand-700 bg-brand-700 text-white"
              : "border-line-strong bg-surface text-ink-700 hover:bg-field"
          }`}
        >
          {color && (
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          <span className="truncate">{label}</span>
        </button>
      </li>
    );
  };
  return (
    <nav aria-label="依 SIG 篩選">
      <ul className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
        {chip("", "全部", undefined)}
        {sigs.map((sig) =>
          chip(
            sig._id,
            sig.name,
            resolveSigColor(sig) ?? BRAND_COLOR,
            sig.name,
          ),
        )}
      </ul>
    </nav>
  );
}

/** The newest announcement, while it is recent. */
function useAnnouncement(enabled: boolean) {
  const { data } = useSigPost(announcementSigId, {
    pageSize: 1,
    sort: "latest",
  });
  if (!enabled) {
    return null;
  }
  const first = data?.pages?.[0]?.[0];
  if (!first || typeof first._id !== "string") {
    return null;
  }
  const age = Date.now() - new Date(first.createdAt ?? "").getTime();
  return age < announcementStayTime * 24 * 60 * 60 * 1000 ? first : null;
}

export function HomeFeed({ mobile = false }: { mobile?: boolean }) {
  const { userData } = useUserAccount();
  const { feed, setFeed, sigId, setSig, deciding, showMySig } = useHomeFeed();
  const mySigs = useMySigs();
  const directory = useSigDirectory();
  const queryClient = useQueryClient();

  // Chips: your SIGs on 我的 SIG, every SIG on 最新. 熱門 has none: a
  // SIG's own list has no 「most liked」 order on the backend.
  const chipSigs = useMemo(() => {
    if (feed === "top") {
      return [];
    }
    if (feed === "mysig") {
      return mySigs.sigs;
    }
    return (directory.data ?? []).filter(
      (sig) => sig._id !== ANNOUNCEMENT_SIG_ID && sig.customId,
    );
  }, [feed, mySigs.sigs, directory.data]);
  const activeSig = chipSigs.some((sig) => sig._id === sigId) ? sigId : "";

  const userId = userData?._id ?? "";
  const source = activeSig ? "sig" : feed;
  const fetchPage = useMemo(() => {
    if (source === "sig") {
      return postListFetcher(
        `/post/list/sig/${encodeURIComponent(activeSig)}`,
        {
          sort: "latest",
        },
      );
    }
    if (source === "mysig") {
      return postListFetcher("/post/list/mysig", {}, true);
    }
    return postListFetcher("/post/list", { sort: "latest" });
  }, [source, activeSig]);
  const listQuery = useThreadPages(
    ["homeFeed", source, activeSig, source === "mysig" ? userId : ""],
    fetchPage,
    PAGE_SIZE,
    source !== "top" && !deciding && (source !== "mysig" || Boolean(userId)),
  );
  const hot = useHotPostList({ pageSize: PAGE_SIZE }, source === "top");
  const query: ThreadListQuery = source === "top" ? hot : listQuery;

  const pinned = usePinnedPost();
  const showTop = !activeSig;
  const announcement = useAnnouncement(showTop && feed !== "mysig");
  const pinnedPosts = showTop
    ? (pinned.data ?? []).filter((post) => post._id !== announcement?._id)
    : undefined;

  // Tapping the current tab in the tab bar: back to the top, fresh posts.
  useEffect(() => {
    if (!mobile) {
      return;
    }
    const onTop = () => {
      void queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      void pinned.refetch();
    };
    window.addEventListener("mobile:scroll-to-top", onTop);
    return () => window.removeEventListener("mobile:scroll-to-top", onTop);
  }, [mobile, queryClient, pinned.refetch]);

  const header = (
    <div className="flex flex-col gap-3">
      <FeedTabs
        value={feed}
        onChange={setFeed}
        showMySig={showMySig}
        mobile={mobile}
      />
      <SigChips
        sigs={chipSigs}
        value={activeSig}
        onChange={setSig}
        mobile={mobile}
      />
      {announcement && <PostCard post={announcement} />}
    </div>
  );

  if (deciding) {
    return (
      <div className="flex flex-col gap-3" aria-hidden>
        <div className="h-10 w-56 animate-pulse rounded-control bg-surface" />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  return (
    <SectionErrorBoundary label="貼文列表">
      <InfiniteThreadList
        query={query}
        header={header}
        pinned={pinnedPosts}
        filter={notAnnouncement}
        label="首頁貼文"
        empty={
          source === "mysig" ? (
            <MySigEmpty mobile={mobile} />
          ) : (
            <p className="rounded-card border border-line border-dashed bg-surface/60 px-6 py-12 text-center text-ink-500 text-sm">
              這裡還沒有貼文
            </p>
          )
        }
      />
    </SectionErrorBoundary>
  );
}

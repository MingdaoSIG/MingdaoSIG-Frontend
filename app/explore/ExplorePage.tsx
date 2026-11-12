"use client";

import { Check, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { EventMini, EventMiniSkeleton } from "@/components/Events/EventMini";
import { PageTitle } from "@/components/mobile/PageTitle";
import {
  RecruitingSigCard,
  useRecruitingSigs,
} from "@/components/Sig/RecruitingSigs";
import { TopTags } from "@/components/Tags/TopTags";
import type { Sig } from "@/interfaces/Sig";
import { SEARCH_MAX_LENGTH, searchHref } from "@/modules/search";
import { isRecruitingNow } from "@/modules/sigRecruiting";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import { promptLogin } from "@/utils/loginPrompt";
import { notice } from "@/utils/notice";
import { ANNOUNCEMENT_SIG_ID, useSigDirectory } from "@/utils/useAdminAccess";
import { useFollowSig } from "@/utils/useFollowSig";
import useIsMobile from "@/utils/useIsMobile";
import { useMySigs } from "@/utils/useMySigs";
import { useUpcomingEvents } from "@/utils/useSiteEvents";
import { useUserAccount } from "@/utils/useUserAccount";

// 探索 (v3 1B), one page: search → 正在招生 → 近期活動 → 熱門標籤 → 全部
// SIG (colour cards, member count, 追蹤). It replaces the home page's SIG
// tiles and the old /data SIG lookup (which redirects here).

function Section({
  title,
  action,
  children,
  id,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-label={title}
      className="shrink-0 rounded-card border border-line bg-surface p-4 shadow-card lg:p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <h2 className="flex-1 font-bold text-base text-ink-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SearchBox() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(searchHref(value));
  }

  return (
    <search className="w-full max-w-[44rem] shrink-0">
      <form onSubmit={onSubmit} className="flex w-full gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-control border border-line-strong bg-surface px-3 shadow-card focus-within:border-brand-700/50 focus-within:ring-2 focus-within:ring-brand-700/20">
          <Search size={18} className="shrink-0 text-ink-500" aria-hidden />
          <span className="sr-only">搜尋貼文、SIG、標籤和使用者</span>
          <input
            type="search"
            enterKeyHint="search"
            value={value}
            maxLength={SEARCH_MAX_LENGTH}
            onChange={(event) => setValue(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-base text-ink-900 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="h-11 shrink-0 cursor-pointer rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
        >
          搜尋
        </button>
      </form>
    </search>
  );
}

function Recruiting({ mobile }: { mobile: boolean }) {
  const { sigs } = useRecruitingSigs();
  if (sigs.length === 0) {
    return null;
  }
  return (
    <Section title="正在招生">
      <ul
        className={
          mobile
            ? "scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1"
            : "grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3"
        }
      >
        {sigs.map((sig) => (
          <li key={sig._id} className={mobile ? "w-60 shrink-0" : "min-w-0"}>
            <RecruitingSigCard sig={sig} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function UpcomingEvents() {
  const events = useUpcomingEvents("all", 4);
  const items = events.data?.items ?? [];
  return (
    <Section
      title="近期活動"
      action={
        <Link
          href="/events"
          className="shrink-0 font-semibold text-brand-700 text-sm hover:underline"
        >
          查看全部
        </Link>
      }
    >
      {events.isPending ? (
        <EventMiniSkeleton rows={2} />
      ) : events.isError ? (
        <p className="text-ink-500 text-sm">近期活動載入失敗</p>
      ) : items.length === 0 ? (
        <p className="text-ink-500 text-sm">接下來 60 天沒有活動</p>
      ) : (
        <ul className="-mx-1.5 grid grid-cols-1 gap-0.5 lg:grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]">
          {items.map((item) => (
            <li key={item.event._id} className="min-w-0">
              <EventMini item={item} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function FollowButton({ sig, mobile }: { sig: Sig; mobile: boolean }) {
  const { isLogin, isLoading, login } = useUserAccount();
  const { sigs } = useMySigs();
  const follow = useFollowSig();
  const mine = sigs.find((item) => item._id === sig._id);
  const height = mobile ? "h-9" : "h-8";

  if (mine && mine.role !== "followed") {
    return (
      <span
        className={`relative z-[1] inline-flex ${height} shrink-0 items-center gap-1 rounded-control bg-ok-50 px-2.5 font-semibold text-ok-700 text-xs`}
      >
        <Check size={14} aria-hidden />
        {mine.role === "managed" ? "管理中" : "已加入"}
      </span>
    );
  }
  const following = follow.isFollowing(sig._id);
  const busy = follow.busy === sig._id;
  return (
    <button
      type="button"
      aria-pressed={following}
      aria-label={`${following ? "取消追蹤" : "追蹤"} ${sig.name}`}
      data-follow={sig._id}
      disabled={busy || isLoading}
      onClick={async () => {
        if (!isLogin) {
          promptLogin(login, {
            text: "登入後即可追蹤 SIG，在首頁看到它的新貼文。",
          });
          return;
        }
        const result = await follow.toggle(sig._id, !following);
        if (!result.ok) {
          notice(
            "error",
            `${following ? "取消追蹤" : "追蹤"}失敗：${result.message}`,
          );
        }
      }}
      className={`relative z-[1] inline-flex ${height} shrink-0 cursor-pointer items-center gap-1 rounded-control px-2.5 font-semibold text-xs transition-colors disabled:cursor-wait disabled:opacity-60 ${
        following
          ? "border border-line-strong bg-surface text-ink-700 hover:bg-field"
          : "bg-brand-700 text-white hover:bg-brand-800"
      }`}
    >
      {following ? (
        <Check size={14} aria-hidden />
      ) : (
        <Plus size={14} aria-hidden />
      )}
      {following ? "已追蹤" : "追蹤"}
    </button>
  );
}

function SigGrid({ mobile }: { mobile: boolean }) {
  const directory = useSigDirectory();
  const sigs = (directory.data ?? []).filter(
    (sig) => sig._id !== ANNOUNCEMENT_SIG_ID && sig.customId,
  );

  if (directory.isPending) {
    return (
      <div
        aria-hidden
        className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]"
      >
        {["a", "b", "c", "d"].map((key) => (
          <div
            key={key}
            className="h-24 animate-pulse rounded-control bg-field"
          />
        ))}
      </div>
    );
  }
  if (directory.isError) {
    return (
      <p role="alert" className="text-ink-500 text-sm">
        SIG 列表載入失敗。
        <button
          type="button"
          className="cursor-pointer font-semibold text-brand-700 hover:underline"
          onClick={() => void directory.refetch()}
        >
          重試
        </button>
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]">
      {sigs.map((sig) => (
        <li key={sig._id} className="min-w-0">
          <div
            data-explore-sig={sig._id}
            className="relative flex h-full min-h-24 flex-col gap-1.5 rounded-control border border-line border-t-[3px] border-t-[var(--sig-color)] bg-surface px-3.5 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--sig-color)_5%,white)]"
            style={{
              ["--sig-color" as string]: resolveSigColor(sig) ?? BRAND_COLOR,
            }}
          >
            <div className="flex min-w-0 items-start gap-2">
              <Link
                href={`/@${sig.customId}`}
                title={sig.name}
                className="sig-text line-clamp-2 min-w-0 flex-1 font-bold text-[0.95rem] leading-snug [overflow-wrap:anywhere] after:absolute after:inset-0 after:content-['']"
              >
                {sig.name}
              </Link>
              <FollowButton sig={sig} mobile={mobile} />
            </div>
            {sig.description && (
              <p className="line-clamp-1 text-ink-500 text-xs">
                {sig.description}
              </p>
            )}
            <p className="mt-auto flex flex-wrap gap-x-2 text-ink-500 text-xs">
              {typeof sig.memberCount === "number" && (
                <span>{sig.memberCount} 位成員</span>
              )}
              {typeof sig.followerCount === "number" &&
                sig.followerCount > 0 && (
                  <span>{sig.followerCount} 人追蹤</span>
                )}
              {isRecruitingNow(sig) && sig.recruiting && (
                <span className="font-semibold text-warm-600">招生中</span>
              )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Content({ mobile }: { mobile: boolean }) {
  return (
    <>
      <SearchBox />
      <Recruiting mobile={mobile} />
      <UpcomingEvents />
      <Section title="熱門標籤">
        <TopTags limit={16} />
      </Section>
      <Section title="全部 SIG" id="all-sigs">
        <SigGrid mobile={mobile} />
      </Section>
    </>
  );
}

export default function ExplorePage() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <PageTitle title="探索" />
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
          <Content mobile />
        </div>
      </div>
    );
  }

  // Layout 1B: full width from 1280px, the grids add columns as the
  // window widens; a centred 56rem column below that.
  return (
    <main className="mx-auto flex w-full max-w-[calc(56rem+3rem)] flex-col gap-4 px-6 xl:max-w-none">
      <header className="rounded-card border border-line bg-surface px-6 py-5 shadow-card">
        <h1 className="font-bold text-2xl text-ink-900 leading-[1.4]">探索</h1>
      </header>
      <Content mobile={false} />
    </main>
  );
}

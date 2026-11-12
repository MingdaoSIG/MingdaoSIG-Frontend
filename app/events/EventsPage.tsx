"use client";

import { CalendarDays, List } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { DocPage } from "@/components/desktop/DocPage";
import { dayHeading, dayKey } from "@/components/Events/eventDays";
import { SiteEventItem } from "@/components/Events/SiteEventItem";
import { PageTitle } from "@/components/mobile/PageTitle";
import { promptLogin } from "@/utils/loginPrompt";
import useIsMobile from "@/utils/useIsMobile";
import { ONE_SIDE_MIN, useMinWidth } from "@/utils/useMinWidth";
import { type EventScope, useSiteEvents } from "@/utils/useSiteEvents";
import { useUserAccount } from "@/utils/useUserAccount";

// 活動 (v3 5C): events of every SIG, a list by default with a 月曆
// toggle (loaded on demand), and 我的 SIG / 全部 / 已報名. RSVP and
// 加到日曆 come from the SIG page's event card. `?scope=` and `?view=`
// are kept in the address so 我的 → 活動報名 can link to 已報名.

const EventCalendar = dynamic(
  () => import("@/components/Events/EventCalendar"),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="h-96 animate-pulse rounded-card border border-line bg-surface"
      />
    ),
  },
);

const SCOPES: { value: EventScope; label: string }[] = [
  { value: "mine", label: "我的 SIG" },
  { value: "all", label: "全部" },
  { value: "rsvped", label: "已報名" },
];

function isScope(value: string | null): value is EventScope {
  return value === "all" || value === "mine" || value === "rsvped";
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  mobile,
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode; aria?: string }[];
  onChange: (value: T) => void;
  mobile: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex w-fit shrink-0 select-none gap-0.5 rounded-control border border-line bg-surface p-0.5 shadow-card"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={option.aria}
            onClick={() => onChange(option.value)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-[6px] px-3.5 font-semibold text-sm transition-colors ${
              mobile ? "h-10" : "h-9"
            } ${active ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-field"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function EventList({
  scope,
  mobile,
  highlight,
}: {
  scope: EventScope;
  mobile: boolean;
  /** The day the side calendar jumped to. */
  highlight?: string | null;
}) {
  const list = useSiteEvents(scope);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  if (list.isPending) {
    return (
      <div aria-hidden className="flex flex-col gap-3">
        {["a", "b", "c"].map((key) => (
          <div
            key={key}
            className="h-36 animate-pulse rounded-card border border-line bg-surface"
          />
        ))}
      </div>
    );
  }
  if (list.isError && items.length === 0) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-10 text-center text-ink-500 text-sm shadow-card"
      >
        <p>{list.error.message}</p>
        <button
          type="button"
          className="h-10 cursor-pointer rounded-control border border-line-strong px-4 font-semibold text-ink-800 hover:bg-field"
          onClick={() => void list.refetch()}
        >
          重試
        </button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="rounded-card border border-line border-dashed bg-surface/60 px-6 py-12 text-center text-ink-500 text-sm">
        {scope === "rsvped"
          ? "接下來 60 天沒有你報名的活動"
          : scope === "mine"
            ? "你的 SIG 接下來 60 天沒有活動"
            : "接下來 60 天沒有活動"}
      </p>
    );
  }
  // Grouped by start day, so the side calendar can jump to a day.
  const groups: { key: string; date: Date; items: typeof items }[] = [];
  for (const item of items) {
    const date = new Date(item.event.startAt);
    const key = dayKey(date);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, date, items: [item] });
    }
  }
  return (
    <div className="flex flex-col gap-4" data-event-list>
      {groups.map((group) => (
        <section
          key={group.key}
          data-event-day={group.key}
          aria-label={dayHeading(group.date)}
          className={`flex scroll-mt-[var(--shell-top)] flex-col gap-3 rounded-card transition-shadow duration-500 ${
            highlight === group.key
              ? "shadow-[0_0_0_3px_var(--color-surface),0_0_0_6px_var(--color-brand-700)]"
              : ""
          }`}
        >
          <h2 className="px-1 font-semibold text-ink-700 text-sm">
            {dayHeading(group.date)}
          </h2>
          {group.items.map((item) => (
            <SiteEventItem key={item.event._id} item={item} mobile={mobile} />
          ))}
        </section>
      ))}
      {list.hasNextPage && (
        <button
          type="button"
          disabled={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage({ cancelRefetch: false })}
          className="mx-auto h-10 cursor-pointer rounded-control border border-line-strong bg-surface px-5 font-semibold text-ink-700 text-sm hover:bg-field disabled:cursor-wait"
        >
          {list.isFetchingNextPage ? "載入中…" : "載入更多"}
        </button>
      )}
    </div>
  );
}

export default function EventsPage() {
  const isMobile = useIsMobile();
  const wide = useMinWidth(ONE_SIDE_MIN);
  const sideBySide = !isMobile && wide;
  const router = useRouter();
  const params = useSearchParams();
  const { isLogin, isLoading, login } = useUserAccount();
  const requested = params.get("scope");
  const [scope, setScopeState] = useState<EventScope>(
    isScope(requested) ? requested : "all",
  );
  const [view, setViewState] = useState<"list" | "calendar">(
    params.get("view") === "calendar" ? "calendar" : "list",
  );
  // Logged out, the signed-in scopes fall back to 全部.
  const effective: EventScope = !isLoading && !isLogin ? "all" : scope;

  function remember(next: { scope?: EventScope; view?: string }) {
    const url = new URL(window.location.href);
    const nextScope = next.scope ?? scope;
    const nextView = next.view ?? view;
    if (nextScope === "all") {
      url.searchParams.delete("scope");
    } else {
      url.searchParams.set("scope", nextScope);
    }
    if (nextView === "list") {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", nextView);
    }
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }

  function setScope(next: EventScope) {
    if (next !== "all" && !isLogin) {
      promptLogin(login, {
        text:
          next === "rsvped"
            ? "登入後即可查看你報名的活動。"
            : "登入後即可查看你的 SIG 的活動。",
      });
      return;
    }
    setScopeState(next);
    remember({ scope: next });
  }

  function setView(next: "list" | "calendar") {
    setViewState(next);
    remember({ view: next });
  }

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented
        label="顯示哪些活動"
        value={effective}
        options={SCOPES}
        onChange={setScope}
        mobile={isMobile}
      />
      <span className="flex-1" />
      <Segmented
        label="顯示方式"
        value={view}
        options={[
          {
            value: "list",
            label: (
              <>
                <List size={16} aria-hidden />
                列表
              </>
            ),
          },
          {
            value: "calendar",
            label: (
              <>
                <CalendarDays size={16} aria-hidden />
                月曆
              </>
            ),
          },
        ]}
        onChange={setView}
        mobile={isMobile}
      />
    </div>
  );

  // Layout 5B: from 1280px the list and the month sit side by side and the
  // 列表 / 月曆 switch goes away.
  const [highlight, setHighlight] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickDay = useCallback((day: string) => {
    const group = document.querySelector<HTMLElement>(
      `[data-event-day="${day}"]`,
    );
    if (!group) {
      return false;
    }
    group.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlight(day);
    if (highlightTimer.current) {
      clearTimeout(highlightTimer.current);
    }
    highlightTimer.current = setTimeout(() => setHighlight(null), 2400);
    return true;
  }, []);

  if (sideBySide) {
    return (
      <main className="flex w-full flex-col gap-4 px-6">
        <header className="rounded-card border border-line bg-surface px-6 py-5 shadow-card">
          <h1 className="font-bold text-2xl text-ink-900 leading-[1.4]">
            活動
          </h1>
          <p className="mt-1 text-ink-500 text-sm">各 SIG 接下來的活動與社課</p>
        </header>
        <div className="grid grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)] items-start gap-6">
          <div className="flex min-w-0 flex-col gap-4">
            <Segmented
              label="顯示哪些活動"
              value={effective}
              options={SCOPES}
              onChange={setScope}
              mobile={false}
            />
            <EventList scope={effective} mobile={false} highlight={highlight} />
          </div>
          <aside
            data-shell="aside"
            className="custom-scrollbar sticky top-[var(--shell-top)] max-h-[calc(100dvh-var(--shell-top)-1rem)] min-w-0 self-start overflow-y-auto"
          >
            <EventCalendar
              scope={effective}
              variant="side"
              onPickDay={pickDay}
            />
          </aside>
        </div>
      </main>
    );
  }

  const body =
    view === "calendar" ? (
      <EventCalendar scope={effective} mobile={isMobile} />
    ) : (
      <EventList scope={effective} mobile={isMobile} />
    );

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <PageTitle title="活動" />
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
          {controls}
          {body}
        </div>
      </div>
    );
  }

  return (
    <DocPage
      title="活動"
      description="各 SIG 接下來的活動與社課"
      width="narrow"
    >
      <div className="flex flex-col gap-4 pb-2">
        {controls}
        {body}
      </div>
    </DocPage>
  );
}

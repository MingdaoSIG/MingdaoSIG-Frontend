"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import {
  type EventScope,
  type SiteEvent,
  useEventWindow,
} from "@/utils/useSiteEvents";
import { EventMini } from "./EventMini";
import { dayHeading, dayKey, daysOf } from "./eventDays";
import { SiteEventItem } from "./SiteEventItem";

// The month calendar of the 活動 page (v3 5C, layout 5B), loaded only when
// shown. One month per request (`/event/list?from&to`); days with events
// are marked in their SIGs' colours.
// - "full" (the 月曆 view under 1280px): titles in the days (dots on
//   phones); choosing a day lists its events below with RSVP.
// - "side" (≥1280px, beside the list): compact days; choosing a day asks
//   the page to jump the list there (`onPickDay`), and lists the events
//   here only when the list does not have that day.

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const colorOf = (item: SiteEvent) => resolveSigColor(item.sig) ?? BRAND_COLOR;

export default function EventCalendar({
  scope,
  mobile = false,
  variant = "full",
  onPickDay,
}: {
  scope: EventScope;
  mobile?: boolean;
  variant?: "full" | "side";
  /** Side variant: jump the list to the day; false when it is not there. */
  onPickDay?: (day: string) => boolean;
}) {
  const today = new Date();
  const side = variant === "side";
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selected, setSelected] = useState<string>(side ? "" : dayKey(today));
  const [outside, setOutside] = useState(false);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const query = useEventWindow(scope, month, to);

  const byDay = useMemo(() => {
    const map = new Map<string, SiteEvent[]>();
    for (const item of query.data?.items ?? []) {
      for (const key of daysOf(item)) {
        map.set(key, [...(map.get(key) ?? []), item]);
      }
    }
    return map;
  }, [query.data]);

  const cells = useMemo(() => {
    const first = new Date(month);
    first.setDate(1 - month.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      return date;
    });
  }, [month]);

  const title = `${month.getFullYear()} 年 ${month.getMonth() + 1} 月`;
  const shown = byDay.get(selected) ?? [];
  const selectedDate = cells.find((date) => dayKey(date) === selected);

  function move(delta: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }

  function pick(key: string) {
    setSelected(key);
    if (side) {
      const inList = (byDay.get(key)?.length ?? 0) > 0 && onPickDay?.(key);
      setOutside(!inList);
    }
  }

  const navButton =
    "flex size-9 cursor-pointer items-center justify-center rounded-control border border-line-strong bg-surface text-ink-700 hover:bg-field";

  return (
    <div data-event-calendar={variant} className="flex flex-col gap-3">
      <section className="rounded-card border border-line bg-surface p-3 shadow-card lg:p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="flex-1 font-bold text-ink-900" aria-live="polite">
            {title}
          </h2>
          <button
            type="button"
            aria-label="上個月"
            onClick={() => move(-1)}
            className={navButton}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="下個月"
            onClick={() => move(1)}
            className={navButton}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
        {query.isError && (
          <p role="alert" className="mb-2 text-danger-700 text-sm">
            {query.error.message}
            <button
              type="button"
              className="ml-2 cursor-pointer font-semibold text-brand-700 hover:underline"
              onClick={() => void query.refetch()}
            >
              重試
            </button>
          </p>
        )}
        <div
          aria-busy={query.isFetching}
          className="grid grid-cols-7 gap-px overflow-hidden rounded-control border border-line bg-line"
        >
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              aria-hidden
              className="bg-field py-1 text-center font-semibold text-ink-500 text-xs"
            >
              {day}
            </div>
          ))}
          {cells.map((date) => {
            const key = dayKey(date);
            const events = byDay.get(key) ?? [];
            const inMonth = date.getMonth() === month.getMonth();
            const isToday = key === dayKey(today);
            const isSelected = key === selected;
            const tint = events[0]
              ? `color-mix(in srgb, ${colorOf(events[0])} ${
                  isSelected ? 30 : 16
                }%, white)`
              : undefined;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${date.getMonth() + 1} 月 ${date.getDate()} 日${
                  events.length ? `，${events.length} 個活動` : ""
                }`}
                data-day={key}
                data-has-events={events.length > 0 || undefined}
                onClick={() => pick(key)}
                style={side && tint ? { backgroundColor: tint } : undefined}
                className={`flex min-w-0 cursor-pointer flex-col items-stretch gap-0.5 p-1 text-left transition-colors ${
                  side ? "h-12" : mobile ? "h-14" : "h-24"
                } ${
                  isSelected && !(side && tint)
                    ? "bg-brand-50"
                    : inMonth
                      ? "bg-surface hover:bg-field"
                      : "bg-field/60 hover:bg-field"
                } ${isSelected ? "outline-2 outline-brand-700 -outline-offset-2" : ""} ${
                  !inMonth && side && tint ? "opacity-60" : ""
                }`}
              >
                <span
                  className={`flex size-6 items-center justify-center self-start rounded-full text-xs tabular-nums ${
                    isToday
                      ? "bg-brand-700 font-bold text-white"
                      : inMonth
                        ? "text-ink-800"
                        : "text-ink-400"
                  }`}
                >
                  {date.getDate()}
                </span>
                {mobile || side ? (
                  <span className="flex flex-wrap gap-0.5 px-0.5">
                    {events.slice(0, 4).map((item) => (
                      <span
                        key={item.event._id}
                        aria-hidden
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: colorOf(item) }}
                      />
                    ))}
                  </span>
                ) : (
                  <>
                    {events.slice(0, 2).map((item) => (
                      <span
                        key={item.event._id}
                        aria-hidden
                        className="truncate rounded-[4px] px-1 py-px text-[11px] text-ink-800 leading-4"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${colorOf(item)} 18%, white)`,
                        }}
                      >
                        {item.event.title}
                      </span>
                    ))}
                    {events.length > 2 && (
                      <span
                        aria-hidden
                        className="px-1 text-[11px] text-ink-500"
                      >
                        還有 {events.length - 2} 個
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
        {side && (
          <p className="mt-2 text-ink-500 text-xs">
            點有顏色的日期，左邊的列表會跳到那一天。
          </p>
        )}
      </section>
      {side ? (
        selected &&
        outside && (
          <section aria-live="polite" className="glass rounded-card p-4">
            <h3 className="mb-2 font-semibold text-ink-700 text-sm">
              {selectedDate ? dayHeading(selectedDate) : ""}
              {shown.length === 0 ? "：沒有活動" : ""}
            </h3>
            {shown.length > 0 && (
              <ul className="-mx-1.5 flex flex-col gap-0.5">
                {shown.map((item) => (
                  <li key={item.event._id}>
                    <EventMini item={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      ) : (
        <section aria-live="polite" className="flex flex-col gap-3">
          <h3 className="px-1 font-semibold text-ink-700 text-sm">
            {selectedDate ? dayHeading(selectedDate) : ""}
            {shown.length === 0 ? "：沒有活動" : `：${shown.length} 個活動`}
          </h3>
          {shown.map((item) => (
            <SiteEventItem key={item.event._id} item={item} mobile={mobile} />
          ))}
        </section>
      )}
    </div>
  );
}

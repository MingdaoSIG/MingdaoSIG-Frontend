"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import {
  type EventScope,
  type SiteEvent,
  useEventWindow,
} from "@/utils/useSiteEvents";
import { SiteEventItem } from "./SiteEventItem";

// The 月曆 view of the 活動 page (v3 5C), loaded only when it is opened.
// One month at a time (`/event/list?from&to`); a day with events shows
// their titles (desktop) or dots (phones); choosing a day lists its
// events below with RSVP.

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Every day an event covers, so a two-day event shows on both. */
function daysOf(item: SiteEvent) {
  const start = new Date(item.event.startAt);
  const end = new Date(item.event.endAt);
  const days: string[] = [];
  if (Number.isNaN(start.getTime())) {
    return days;
  }
  const cursor = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const last = Number.isNaN(end.getTime()) ? cursor : end;
  for (let i = 0; i < 62 && cursor <= last; i++) {
    days.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export default function EventCalendar({
  scope,
  mobile = false,
}: {
  scope: EventScope;
  mobile?: boolean;
}) {
  const today = new Date();
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selected, setSelected] = useState<string>(dayKey(today));
  const from = month;
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const query = useEventWindow(scope, from, to);

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

  return (
    <div data-event-calendar className="flex flex-col gap-3">
      <section className="rounded-card border border-line bg-surface p-3 shadow-card lg:p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="flex-1 font-bold text-ink-900" aria-live="polite">
            {title}
          </h2>
          <button
            type="button"
            aria-label="上個月"
            onClick={() => move(-1)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-control border border-line-strong bg-surface text-ink-700 hover:bg-field"
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="下個月"
            onClick={() => move(1)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-control border border-line-strong bg-surface text-ink-700 hover:bg-field"
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
          aria-label={title}
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
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${date.getMonth() + 1} 月 ${date.getDate()} 日${
                  events.length ? `，${events.length} 個活動` : ""
                }`}
                data-day={key}
                onClick={() => setSelected(key)}
                className={`flex min-w-0 cursor-pointer flex-col items-stretch gap-0.5 p-1 text-left transition-colors ${
                  mobile ? "h-14" : "h-24"
                } ${isSelected ? "bg-brand-50" : inMonth ? "bg-surface hover:bg-field" : "bg-field/60 hover:bg-field"}`}
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
                {mobile ? (
                  <span className="flex flex-wrap gap-0.5 px-0.5">
                    {events.slice(0, 4).map((item) => (
                      <span
                        key={item.event._id}
                        aria-hidden
                        className="size-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            resolveSigColor(item.sig) ?? BRAND_COLOR,
                        }}
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
                          backgroundColor: `color-mix(in srgb, ${
                            resolveSigColor(item.sig) ?? BRAND_COLOR
                          } 18%, white)`,
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
      </section>
      <section aria-live="polite" className="flex flex-col gap-3">
        <h3 className="px-1 font-semibold text-ink-700 text-sm">
          {selectedDate
            ? `${selectedDate.getMonth() + 1} 月 ${selectedDate.getDate()} 日`
            : ""}
          {shown.length === 0 ? "：沒有活動" : `：${shown.length} 個活動`}
        </h3>
        {shown.map((item) => (
          <SiteEventItem key={item.event._id} item={item} mobile={mobile} />
        ))}
      </section>
    </div>
  );
}

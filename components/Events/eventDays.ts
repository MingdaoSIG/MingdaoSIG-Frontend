import type { SiteEvent } from "@/utils/useSiteEvents";

/** A local calendar day as `y-m-d` (month 0-based), for grouping. */
export function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Every day an event covers, so a two-day event shows on both. */
export function daysOf(item: SiteEvent) {
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

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

/** 「11 月 15 日（日）」 */
export function dayHeading(date: Date) {
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日（${WEEKDAY[date.getDay()]}）`;
}

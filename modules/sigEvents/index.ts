import type {
  TEventRsvp,
  TSigEvent,
  TSigEventInput,
} from "@/interfaces/Engagement";
import { type ApiFailure, apiRequest } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { SITE_URL } from "@/modules/site";

// SIG events (活動與社課, design/api-contract-v4.md §3.3): the API calls,
// the calendar links and the rules the UI shows (past, full, closed).
//
// The backend counts an event as past only after `endAt`; until then,
// including while it runs, it is upcoming and still takes RSVPs.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const EVENT_TITLE_MAX = 60;
export const EVENT_DESCRIPTION_MAX = 1000;
export const EVENT_LOCATION_MAX = 60;
export const EVENT_CAPACITY_MAX = 100000;
/** The backend's page cap; the RSVP export pages through with it. */
export const RSVP_PAGE_MAX = 100;

export type EventWhen = "upcoming" | "past" | "all";

export type EventPage = { items: TSigEvent[]; total: number };

function isEvent(value: unknown): value is TSigEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TSigEvent)._id === "string" &&
    typeof (value as TSigEvent).startAt === "string"
  );
}

/** The event in a create / edit / RSVP answer, or null. */
export function eventOf(value: unknown): TSigEvent | null {
  return isEvent(value) ? value : null;
}

export async function fetchSigEvents(
  sigId: string,
  query: { when: EventWhen; skip: number; limit: number },
  signal?: AbortSignal,
) {
  const result = await apiRequest<TSigEvent[]>(
    `/sig/${encodeURIComponent(sigId)}/events`,
    { query, signal, auth: true },
  );
  if (!result.ok) {
    return result;
  }
  const items = Array.isArray(result.data) ? result.data.filter(isEvent) : [];
  const total =
    typeof result.body.total === "number" ? result.body.total : items.length;
  return { ...result, data: { items, total } satisfies EventPage };
}

export function createSigEvent(sigId: string, input: TSigEventInput) {
  return apiRequest<TSigEvent>(`/sig/${encodeURIComponent(sigId)}/events`, {
    method: "POST",
    body: input,
    auth: true,
  });
}

export function editSigEvent(eventId: string, patch: Partial<TSigEventInput>) {
  return apiRequest<TSigEvent>(`/event/${encodeURIComponent(eventId)}`, {
    method: "POST",
    body: patch,
    auth: true,
  });
}

export function removeSigEvent(eventId: string) {
  return apiRequest<{ _id: string; removed: true }>(
    `/event/${encodeURIComponent(eventId)}`,
    { method: "DELETE", auth: true },
  );
}

export function rsvpSigEvent(eventId: string, attend: boolean) {
  return apiRequest<TSigEvent>(`/event/${encodeURIComponent(eventId)}/rsvp`, {
    method: attend ? "POST" : "DELETE",
    auth: true,
  });
}

export async function fetchRsvpPage(
  eventId: string,
  query: { skip: number; limit: number },
  signal?: AbortSignal,
) {
  const result = await apiRequest<TEventRsvp[]>(
    `/event/${encodeURIComponent(eventId)}/rsvps`,
    { query, signal, auth: true },
  );
  if (!result.ok) {
    return result;
  }
  const items = Array.isArray(result.data)
    ? result.data.filter((row) => row && typeof row.user?._id === "string")
    : [];
  const total =
    typeof result.body.total === "number" ? result.body.total : items.length;
  return { ...result, data: { items, total } };
}

/**
 * Every RSVP of an event, for the Excel export. The list is paginated
 * (at most 100 a page), so this asks page after page until `total`.
 */
export async function fetchAllRsvps(
  eventId: string,
  signal?: AbortSignal,
): Promise<
  { ok: true; items: TEventRsvp[] } | { ok: false; failure: ApiFailure }
> {
  const items: TEventRsvp[] = [];
  let total = Number.POSITIVE_INFINITY;
  // A hard stop in case `total` keeps growing while we read.
  for (let page = 0; items.length < total && page < 1000; page++) {
    const result = await fetchRsvpPage(
      eventId,
      { skip: page * RSVP_PAGE_MAX, limit: RSVP_PAGE_MAX },
      signal,
    );
    if (!result.ok) {
      return { ok: false, failure: result };
    }
    items.push(...result.data.items);
    total = result.data.total;
    if (result.data.items.length < RSVP_PAGE_MAX) {
      break;
    }
  }
  return { ok: true, items };
}

// ---- Rules -----------------------------------------------------------

export type EventPhase = "upcoming" | "ongoing" | "past";

export function eventPhase(event: TSigEvent, now: number = Date.now()) {
  const start = new Date(event.startAt).getTime();
  const end = new Date(event.endAt).getTime();
  if (end < now) {
    return "past" as const;
  }
  if (start <= now) {
    return "ongoing" as const;
  }
  return "upcoming" as const;
}

export function isFull(event: TSigEvent) {
  return event.capacity > 0 && event.rsvpCount >= event.capacity;
}

export type RsvpState = "rsvped" | "open" | "closed" | "full" | "past";

/** What the RSVP button can do for this viewer right now. */
export function rsvpState(
  event: TSigEvent,
  now: number = Date.now(),
): RsvpState {
  if (eventPhase(event, now) === "past") {
    return "past";
  }
  if (event.rsvpedByMe) {
    return "rsvped";
  }
  if (!event.rsvpOpen) {
    return "closed";
  }
  if (isFull(event)) {
    return "full";
  }
  return "open";
}

/** 「已報名 12 / 30 人」 or 「已報名 12 人・不限名額」 */
export function capacityText(event: TSigEvent) {
  if (event.capacity > 0) {
    return `已報名 ${event.rsvpCount} / ${event.capacity} 人`;
  }
  return `已報名 ${event.rsvpCount} 人・不限名額`;
}

/** A Traditional Chinese reason for a refused event request. */
export function eventFailureMessage(
  failure: ApiFailure,
  action: "rsvp" | "save" | "remove" | "load",
) {
  if (failure.status === CustomStatus.CONTENT_SIZE_EXCEEDED) {
    return "名額已滿";
  }
  if (failure.status === CustomStatus.FORBIDDEN) {
    if (action === "rsvp") {
      return "報名已截止，或活動已經結束";
    }
    return "你沒有權限管理這個 SIG 的活動";
  }
  if (failure.kind === "not-found") {
    return "找不到這個活動，可能已經被刪除";
  }
  if (failure.status === CustomStatus.EMPTY_CONTENT) {
    return "活動名稱不能空白";
  }
  if (failure.status === CustomStatus.INVALID_CONTENT_LENGTH) {
    return `活動名稱最多 ${EVENT_TITLE_MAX} 字，地點最多 ${EVENT_LOCATION_MAX} 字，說明最多 ${EVENT_DESCRIPTION_MAX} 字`;
  }
  if (failure.status === CustomStatus.INVALID_BODY) {
    return "活動資料格式不正確：請確認時間（結束不能早於開始）與名額";
  }
  return failure.message;
}

// ---- Calendar links --------------------------------------------------

/** The public page of the SIG's events. */
export function sigEventsPageUrl(sigCustomId: string | undefined) {
  return sigCustomId ? `${SITE_URL}/@${sigCustomId}?tab=events` : SITE_URL;
}

/** 20261118T081000Z */
function calendarStamp(iso: string) {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** calendar.google.com's "add event" page, prefilled. */
export function googleCalendarUrl(
  event: TSigEvent,
  options: { sigName?: string; sigCustomId?: string } = {},
) {
  const details = [
    event.description.trim(),
    options.sigName ? `主辦：${options.sigName}` : "",
    sigEventsPageUrl(options.sigCustomId),
  ]
    .filter(Boolean)
    .join("\n\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${calendarStamp(event.startAt)}/${calendarStamp(event.endAt)}`,
    details,
  });
  if (event.location.trim()) {
    params.set("location", event.location.trim());
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** One event as an .ics download (served by the API). */
export function eventIcsUrl(eventId: string) {
  return `${API_URL}/event/${encodeURIComponent(eventId)}.ics`;
}

/** Every upcoming event of the SIG (and the last 30 days) as .ics. */
export function sigCalendarIcsUrl(sigId: string) {
  return `${API_URL}/sig/${encodeURIComponent(sigId)}/calendar.ics`;
}

// ---- Dates -----------------------------------------------------------

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dayText(date: Date, withYear: boolean) {
  const day = `${date.getMonth() + 1}/${date.getDate()}（${WEEKDAY[date.getDay()]}）`;
  return withYear ? `${date.getFullYear()}/${day}` : day;
}

function timeText(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 「11/18（三）16:10–18:00」, or both days when it spans more than one;
 * the year is added when it is not this year.
 */
export function formatEventTime(event: TSigEvent, now: Date = new Date()) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }
  const withYear =
    start.getFullYear() !== now.getFullYear() ||
    end.getFullYear() !== now.getFullYear();
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${dayText(start, withYear)} ${timeText(start)}–${timeText(end)}`;
  }
  return `${dayText(start, withYear)} ${timeText(start)} – ${dayText(end, withYear)} ${timeText(end)}`;
}

/** Month and day for the date block on a card. */
export function eventDateParts(event: TSigEvent) {
  const start = new Date(event.startAt);
  return {
    month: `${start.getMonth() + 1} 月`,
    day: String(start.getDate()),
    weekday: `週${WEEKDAY[start.getDay()]}`,
  };
}

/** An ISO date as the value of <input type="datetime-local">. */
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** A datetime-local value (the browser's local time) as an ISO date. */
export function fromLocalInput(value: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

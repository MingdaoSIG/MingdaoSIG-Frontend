"use client";

import {
  CalendarPlus,
  Check,
  Clock,
  Download,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { TSigEvent } from "@/interfaces/Engagement";
import {
  capacityText,
  eventDateParts,
  eventFailureMessage,
  eventIcsUrl,
  eventOf,
  eventPhase,
  formatEventTime,
  googleCalendarUrl,
  rsvpSigEvent,
  rsvpState,
} from "@/modules/sigEvents";
import { promptLogin } from "@/utils/loginPrompt";
import { notice } from "@/utils/notice";
import { useInvalidateEvents, usePatchEvent } from "@/utils/useSigEvents";
import { useUserAccount } from "@/utils/useUserAccount";

// One SIG event: date block, time and place, the RSVP button with the
// capacity, 「加到 Google 日曆」 and 「下載 .ics」, and 編輯 / 刪除 for
// the SIG's managers. Self-contained: it RSVPs and patches the cached
// lists itself, so any page can mount it.

export type SigRef = { _id: string; name: string; customId?: string };

const DESCRIPTION_PREVIEW = 140;

const secondaryClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control bg-brand-700 px-4 font-semibold text-sm text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50";

function RsvpButton({ event, mobile }: { event: TSigEvent; mobile: boolean }) {
  const { isLogin, isLoading, login } = useUserAccount();
  const patch = usePatchEvent();
  const invalidate = useInvalidateEvents();
  const [busy, setBusy] = useState(false);
  const state = rsvpState(event);
  const height = mobile ? "h-10" : "h-9";

  async function send(attend: boolean) {
    if (isLoading || busy) {
      return;
    }
    if (!isLogin) {
      promptLogin(login, { text: "登入後即可報名活動" });
      return;
    }
    setBusy(true);
    const result = await rsvpSigEvent(event._id, attend);
    setBusy(false);
    if (!result.ok) {
      notice("error", eventFailureMessage(result, "rsvp"));
      // Full or closed meanwhile: show the current numbers.
      void invalidate(event.sig);
      return;
    }
    const saved = eventOf(result.data);
    if (saved) {
      patch(saved);
    }
    notice("success", attend ? "已報名，記得準時參加" : "已取消報名");
  }

  if (state === "rsvped") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex ${height} items-center gap-1.5 rounded-control bg-ok-50 px-3 font-semibold text-ok-700 text-sm`}
        >
          <Check size={16} aria-hidden />
          已報名
        </span>
        <button
          type="button"
          className={`${secondaryClass} ${height}`}
          disabled={busy}
          onClick={() => void send(false)}
        >
          {busy ? "取消中…" : "取消報名"}
        </button>
      </div>
    );
  }
  if (state === "open") {
    return (
      <button
        type="button"
        className={`${primaryClass} ${height}`}
        disabled={busy}
        onClick={() => void send(true)}
      >
        {busy ? "報名中…" : "報名"}
      </button>
    );
  }
  if (state === "past" && event.rsvpedByMe) {
    return (
      <span
        className={`inline-flex ${height} items-center gap-1.5 rounded-control bg-field px-3 font-semibold text-ink-500 text-sm`}
      >
        <Check size={16} aria-hidden />
        你有報名
      </span>
    );
  }
  const label =
    state === "full" ? "名額已滿" : state === "closed" ? "報名已截止" : "";
  if (!label) {
    return null;
  }
  return (
    <span
      className={`inline-flex ${height} items-center rounded-control bg-field px-3 font-semibold text-ink-500 text-sm`}
    >
      {label}
    </span>
  );
}

export function SigEventCard({
  event,
  sig,
  canManage = false,
  onEdit,
  onDelete,
  variant = "desktop",
}: {
  event: TSigEvent;
  sig: SigRef;
  /** The viewer leads or advises this SIG, or is an admin. */
  canManage?: boolean;
  onEdit?: (event: TSigEvent) => void;
  onDelete?: (event: TSigEvent) => void;
  variant?: "desktop" | "mobile";
}) {
  const mobile = variant === "mobile";
  const [expanded, setExpanded] = useState(false);
  const phase = eventPhase(event);
  const past = phase === "past";
  const date = eventDateParts(event);
  const description = event.description.trim();
  const long = Array.from(description).length > DESCRIPTION_PREVIEW;
  const shownDescription =
    long && !expanded
      ? `${Array.from(description).slice(0, DESCRIPTION_PREVIEW).join("")}…`
      : description;
  const height = mobile ? "h-10" : "h-9";

  return (
    <article
      aria-labelledby={`event-${event._id}-title`}
      className={`flex gap-4 rounded-card border border-line bg-surface shadow-card ${
        mobile ? "p-4" : "p-5"
      } ${past ? "opacity-80" : ""}`}
    >
      <div
        aria-hidden
        className={`flex w-14 shrink-0 flex-col items-center self-start rounded-control border py-1.5 ${
          past
            ? "border-line bg-field text-ink-500"
            : "border-brand-700/25 bg-brand-50 text-brand-800"
        }`}
      >
        <span className="font-semibold text-[11px] leading-4">
          {date.month}
        </span>
        <span className="font-bold text-2xl tabular-nums leading-7">
          {date.day}
        </span>
        <span className="text-[11px] leading-4">{date.weekday}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
          <h3
            id={`event-${event._id}-title`}
            className="min-w-0 break-words font-bold text-ink-900 text-lg leading-snug"
          >
            {event.title}
          </h3>
          {phase === "ongoing" && (
            <span className="mt-0.5 rounded-chip bg-ok-50 px-1.5 py-0.5 font-semibold text-ok-700 text-xs">
              進行中
            </span>
          )}
          {past && (
            <span className="mt-0.5 rounded-chip bg-field px-1.5 py-0.5 font-semibold text-ink-500 text-xs">
              已結束
            </span>
          )}
          {!past && !event.rsvpOpen && (
            <span className="mt-0.5 rounded-chip bg-warm-50 px-1.5 py-0.5 font-semibold text-warm-600 text-xs">
              不開放報名
            </span>
          )}
        </div>

        <ul className="flex flex-col gap-1 text-ink-700 text-sm">
          <li className="flex items-start gap-1.5">
            <Clock
              size={15}
              aria-hidden
              className="mt-[3px] shrink-0 text-ink-500"
            />
            <span>
              <span className="sr-only">時間：</span>
              <time dateTime={event.startAt}>{formatEventTime(event)}</time>
            </span>
          </li>
          {event.location.trim() && (
            <li className="flex items-start gap-1.5">
              <MapPin
                size={15}
                aria-hidden
                className="mt-[3px] shrink-0 text-ink-500"
              />
              <span className="min-w-0 break-words">
                <span className="sr-only">地點：</span>
                {event.location}
              </span>
            </li>
          )}
          <li className="flex items-start gap-1.5">
            <Users
              size={15}
              aria-hidden
              className="mt-[3px] shrink-0 text-ink-500"
            />
            <span>{capacityText(event)}</span>
          </li>
        </ul>

        {description && (
          <p className="whitespace-pre-line break-words text-[15px] text-ink-700 leading-[1.7]">
            {shownDescription}
            {long && (
              <button
                type="button"
                className="ml-1 cursor-pointer font-semibold text-brand-700 text-sm hover:underline"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
              >
                {expanded ? "收起" : "顯示全部"}
              </button>
            )}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <RsvpButton event={event} mobile={mobile} />
          {!past && (
            <>
              <a
                href={googleCalendarUrl(event, {
                  sigName: sig.name,
                  sigCustomId: sig.customId,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className={`${secondaryClass} ${height}`}
              >
                <CalendarPlus size={16} aria-hidden />
                加到 Google 日曆
              </a>
              <a
                href={eventIcsUrl(event._id)}
                download
                className={`${secondaryClass} ${height}`}
              >
                <Download size={16} aria-hidden />
                下載 .ics
              </a>
            </>
          )}
          {canManage && (onEdit || onDelete) && (
            <span className="flex gap-1 sm:ml-auto">
              {onEdit && (
                <button
                  type="button"
                  className={`${secondaryClass} ${height}`}
                  onClick={() => onEdit(event)}
                  aria-label={`編輯活動「${event.title}」`}
                >
                  <Pencil size={15} aria-hidden />
                  編輯
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className={`${secondaryClass} ${height} text-danger-700 hover:bg-danger-50`}
                  onClick={() => onDelete(event)}
                  aria-label={`刪除活動「${event.title}」`}
                >
                  <Trash2 size={15} aria-hidden />
                  刪除
                </button>
              )}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

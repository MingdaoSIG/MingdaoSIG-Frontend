"use client";

import { CalendarClock } from "lucide-react";
import type { ReactNode } from "react";
import type { SigRecruiting } from "@/interfaces/Sig";
import { formatUntil, recruitingOf } from "@/modules/sigRecruiting";

/**
 * 招生中／暫停招生 for a SIG page (contract v4 §5.6), with the SIG's
 * `recruiting.message` and closing time. Self-contained so the SIG page
 * redesign can place it anywhere:
 *
 * - `inline`: a status chip and the text under it (today's profile card);
 * - `card`: a bordered card with room for an action, e.g. the 申請加入
 *   button on the non-member landing page.
 *
 * A closing time in the past reads as 暫停招生 (the backend refuses then).
 */
export function RecruitingStatus({
  recruiting,
  variant = "inline",
  action,
  className = "",
  now,
}: {
  recruiting: SigRecruiting | null | undefined;
  variant?: "inline" | "card";
  /** Card only: shown at the bottom (a join button). */
  action?: ReactNode;
  className?: string;
  /** For tests and previews; defaults to the current time. */
  now?: Date;
}) {
  const state = recruitingOf({ recruiting: recruiting ?? undefined });
  const at = now ?? new Date();
  const expired = state.until !== null && state.until <= at;
  const open = state.open && !expired;

  const chip = (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-chip px-2 py-0.5 font-semibold text-xs leading-5 ${
        open ? "bg-ok-50 text-ok-700" : "bg-field text-ink-500"
      }`}
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${open ? "bg-ok-700" : "bg-ink-400"}`}
      />
      {open ? "招生中" : "暫停招生"}
    </span>
  );

  const until =
    state.until &&
    (open ? (
      <span className="inline-flex items-center gap-1">
        <CalendarClock aria-hidden className="size-3.5 shrink-0" />
        收件至 {formatUntil(state.until)}
      </span>
    ) : expired ? (
      <span>已於 {formatUntil(state.until)} 截止收件</span>
    ) : null);

  const message = state.message.trim();

  if (variant === "card") {
    return (
      <section
        aria-label="招生狀態"
        className={`rounded-card border border-line bg-surface p-4 shadow-card ${className}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {chip}
          {until && <span className="text-ink-500 text-xs">{until}</span>}
        </div>
        {message ? (
          <p className="mt-2 whitespace-pre-wrap break-words text-ink-700 text-sm leading-relaxed">
            {message}
          </p>
        ) : (
          <p className="mt-2 text-ink-500 text-sm">
            {open
              ? "歡迎申請加入，幹部會盡快審核。"
              : "這個 SIG 目前沒有開放申請。"}
          </p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </section>
    );
  }

  return (
    <div className={`flex flex-col gap-1 text-[13px] ${className}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-500">
        {chip}
        {until}
      </div>
      {message && (
        <p className="whitespace-pre-wrap break-words text-ink-700 leading-relaxed">
          {message}
        </p>
      )}
    </div>
  );
}

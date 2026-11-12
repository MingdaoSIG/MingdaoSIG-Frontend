"use client";

import Link from "next/link";
import { eventDateParts, formatEventTime } from "@/modules/sigEvents";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import type { SiteEvent } from "@/utils/useSiteEvents";

// One upcoming event as a row: the date block in the SIG colour, the
// title, the SIG and the time. Links to the SIG's 活動 tab. Used by the
// home right column and 探索.

export function EventMini({ item }: { item: SiteEvent }) {
  const { event, sig } = item;
  const date = eventDateParts(event);
  const color = resolveSigColor(sig) ?? BRAND_COLOR;
  const href = sig.customId ? `/@${sig.customId}?tab=events` : "/events";
  return (
    <Link
      href={href}
      data-event-mini={event._id}
      className="flex min-w-0 items-center gap-3 rounded-control p-1.5 transition-colors hover:bg-field"
      style={{ ["--sig-color" as string]: color }}
    >
      <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-control bg-[color-mix(in_srgb,var(--sig-color)_14%,white)] leading-none">
        <span className="sig-text font-semibold text-[10px]">{date.month}</span>
        <span className="sig-text font-bold text-base tabular-nums">
          {date.day}
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold text-[0.9rem] text-ink-900">
          {event.title}
        </span>
        <span className="truncate text-ink-500 text-xs">
          {sig.name ? `${sig.name} · ` : ""}
          {formatEventTime(event)}
        </span>
      </span>
    </Link>
  );
}

export function EventMiniSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, index) => `row-${index}`).map((key) => (
        <div key={key} className="flex items-center gap-3 p-1.5">
          <span className="size-11 animate-pulse rounded-control bg-field" />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="h-4 w-2/3 animate-pulse rounded-chip bg-field" />
            <span className="h-3 w-1/2 animate-pulse rounded-chip bg-field" />
          </span>
        </div>
      ))}
    </div>
  );
}

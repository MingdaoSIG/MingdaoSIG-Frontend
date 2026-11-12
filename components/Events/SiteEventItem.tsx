"use client";

import Link from "next/link";
import { SigEventCard } from "@/components/SigEvents/SigEventCard";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import type { SiteEvent } from "@/utils/useSiteEvents";

/**
 * An event on the site-wide 活動 page: the SIG it belongs to above the
 * SIG page's event card (RSVP, 加到日曆, .ics).
 */
export function SiteEventItem({
  item,
  mobile = false,
}: {
  item: SiteEvent;
  mobile?: boolean;
}) {
  const { event, sig } = item;
  const color = resolveSigColor(sig) ?? BRAND_COLOR;
  return (
    <div data-site-event={event._id} className="flex min-w-0 flex-col gap-1.5">
      {sig.name && (
        <p
          className="flex min-w-0 items-center gap-1.5 px-1 text-[13px]"
          style={{ ["--sig-color" as string]: color }}
        >
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full bg-[var(--sig-color)]"
          />
          {sig.customId ? (
            <Link
              href={`/@${sig.customId}?tab=events`}
              className="sig-text min-w-0 truncate font-semibold hover:underline"
            >
              {sig.name}
            </Link>
          ) : (
            <span className="sig-text min-w-0 truncate font-semibold">
              {sig.name}
            </span>
          )}
        </p>
      )}
      <SigEventCard
        event={event}
        sig={{ _id: sig._id, name: sig.name, customId: sig.customId }}
        variant={mobile ? "mobile" : "desktop"}
      />
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { ONE_SIDE_MIN, TWO_SIDES_MIN, useMinWidth } from "@/utils/useMinWidth";

// Desktop page frame of the 2026 redesign (owner pick 1B): full width,
// with the reading column kept to a readable measure (`mainMax`) and the
// extra width turned into side columns.
//
// - ≥1600px: `wideLeft` | main | `wideRight` (either may be absent).
// - 1280–1600px: main | `oneSide` (one column on the right).
// - <1280px: the main column only, centred.
//
// Side columns stick under the header (`--shell-top`) and scroll on
// their own only when taller than the window. They are rendered only at
// the widths where they show. Phones never use this frame.

const sideClass =
  "custom-scrollbar sticky top-[var(--shell-top)] flex max-h-[calc(100dvh-var(--shell-top)-1rem)] min-h-0 min-w-0 flex-col gap-4 self-start overflow-y-auto";

export function PageColumns({
  main,
  wideLeft,
  wideRight,
  oneSide,
  mainMax = "52rem",
  className = "",
}: {
  main: ReactNode;
  wideLeft?: ReactNode;
  wideRight?: ReactNode;
  /** The one side column at 1280–1600px (and ≥1600 when no wide ones). */
  oneSide?: ReactNode;
  /** The reading column's largest width. */
  mainMax?: string;
  className?: string;
}) {
  const one = useMinWidth(ONE_SIDE_MIN);
  const two = useMinWidth(TWO_SIDES_MIN);
  const hasWide = Boolean(wideLeft || wideRight);

  let left: ReactNode = null;
  let right: ReactNode = null;
  if (two && hasWide) {
    left = wideLeft ?? null;
    right = wideRight ?? null;
  } else if (one) {
    right = oneSide ?? null;
  }

  const columns = [
    left ? "minmax(16rem, 1fr)" : null,
    `minmax(0, ${mainMax})`,
    right ? "minmax(17rem, 1fr)" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      data-columns={1 + (left ? 1 : 0) + (right ? 1 : 0)}
      className={`grid w-full gap-6 px-6 ${
        left || right ? "" : "justify-center"
      } ${className}`}
      style={{ gridTemplateColumns: columns }}
    >
      {left && (
        <aside data-shell="aside" data-side="left" className={sideClass}>
          {left}
        </aside>
      )}
      <div data-split-main className="flex min-w-0 flex-col">
        {main}
      </div>
      {right && (
        <aside data-shell="aside" data-side="right" className={sideClass}>
          {right}
        </aside>
      )}
    </div>
  );
}

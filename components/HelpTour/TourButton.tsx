"use client";

import { MousePointerClick } from "lucide-react";
import { startTour } from "@/modules/help/tourState";
import type { TourId } from "@/modules/help/types";

// 「在網站上帶我走一遍」: starts the tour; the overlay loads on demand.
export function TourButton({ tour }: { tour: TourId }) {
  return (
    <button
      type="button"
      onClick={() => startTour(tour)}
      data-tour-start={tour}
      className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-control bg-brand-700 px-4 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
    >
      <MousePointerClick aria-hidden className="size-4" />
      在網站上帶我走一遍
    </button>
  );
}

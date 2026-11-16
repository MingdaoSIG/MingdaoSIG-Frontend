"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { readTour, TOUR_EVENT, type TourState } from "@/modules/help/tourState";

// Always mounted (app/device.tsx) and tiny: it only watches whether a tour
// is running. The overlay and the tour steps load on demand.

const TourOverlay = dynamic(() => import("./TourOverlay"), { ssr: false });

export function TourHost() {
  const [state, setState] = useState<TourState | null>(null);

  useEffect(() => {
    setState(readTour());
    const onTour = () => setState(readTour());
    window.addEventListener(TOUR_EVENT, onTour);
    return () => window.removeEventListener(TOUR_EVENT, onTour);
  }, []);

  return state ? <TourOverlay state={state} /> : null;
}

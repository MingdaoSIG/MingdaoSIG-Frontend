import type { TourId } from "./types";

// The guided tour's progress («在網站上帶我走一遍»). It lives in
// sessionStorage so a tour survives route changes and reloads in the same
// tab. `TourHost` (components/HelpTour) listens for TOUR_EVENT and loads
// the overlay only while a tour is running.

const KEY = "mdsig-tour";
export const TOUR_EVENT = "mdsig:tour";

export type TourState = { id: TourId; step: number };

const TOUR_IDS: TourId[] = ["post", "join", "event"];

export function readTour(): TourState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const value = JSON.parse(raw) as Partial<TourState>;
    if (
      typeof value.id === "string" &&
      TOUR_IDS.includes(value.id as TourId) &&
      typeof value.step === "number" &&
      value.step >= 0
    ) {
      return { id: value.id as TourId, step: Math.floor(value.step) };
    }
  } catch {
    // unreadable: no tour
  }
  return null;
}

export function writeTour(state: TourState | null) {
  try {
    if (state) {
      window.sessionStorage.setItem(KEY, JSON.stringify(state));
    } else {
      window.sessionStorage.removeItem(KEY);
    }
  } catch {
    // storage blocked: the tour still runs on this page
  }
  window.dispatchEvent(new CustomEvent(TOUR_EVENT, { detail: state }));
}

export function startTour(id: TourId) {
  writeTour({ id, step: 0 });
}

export function endTour() {
  writeTour(null);
}

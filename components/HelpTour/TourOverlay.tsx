"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { endTour, type TourState, writeTour } from "@/modules/help/tourState";
import { stepAt, TOURS, type TourStep } from "@/modules/help/tours";
import useIsMobile from "@/utils/useIsMobile";

// The guided tour («在網站上帶我走一遍», decision 2C): a spotlight on one
// element marked `data-tour="…"` and a bubble with 上一步 / 下一步 / 結束.
// The step is kept in sessionStorage (modules/help/tourState), so the tour
// carries on after a route change: a step names the path it belongs to,
// and the tour navigates there itself when 上一步 / 下一步 need it. When
// the element is not on the page (logged out, no SIG, no event…) the
// bubble says why and offers 結束. Esc ends the tour; Tab stays in the
// bubble. The dimmed area does not block the page.

type Box = { top: number; left: number; width: number; height: number };

const FIND_TIMEOUT = 6000;
const PAUSE_GRACE = 1200;
const BUBBLE_SPACE = 210;
const GAP = 12;
const PAD = 6;

function targetNames(step: TourStep, mobile: boolean) {
  return (mobile && step.mobileTarget ? step.mobileTarget : step.target).join(
    "|",
  );
}

/** The first element of the names (in order) that is on screen. */
function findTarget(names: string): HTMLElement | null {
  for (const name of names.split("|")) {
    const list = document.querySelectorAll<HTMLElement>(
      `[data-tour="${name}"]`,
    );
    for (const element of Array.from(list)) {
      const box = element.getBoundingClientRect();
      if (
        box.width > 0 &&
        box.height > 0 &&
        getComputedStyle(element).visibility !== "hidden"
      ) {
        return element;
      }
    }
  }
  return null;
}

/** A modal of the page (a dialog, the onboarding) is open. */
function pageModalOpen() {
  return Boolean(
    document.querySelector(
      'dialog[open], [aria-modal="true"]:not([data-tour-bubble])',
    ),
  );
}

function sameBox(a: Box | null, b: Box | null) {
  return (
    a === b ||
    (a !== null &&
      b !== null &&
      a.top === b.top &&
      a.left === b.left &&
      a.width === b.width &&
      a.height === b.height)
  );
}

type Status = "finding" | "found" | "missing" | "away";

export default function TourOverlay({ state }: { state: TourState }) {
  const tour = TOURS[state.id];
  const index = Math.min(state.step, tour.steps.length - 1);
  const step = tour.steps[index];
  const last = index === tour.steps.length - 1;
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const isMobile = useIsMobile();
  const here = stepAt(step, pathname);
  const name = targetNames(step, isMobile);

  const [status, setStatus] = useState<Status>("finding");
  const [box, setBox] = useState<Box | null>(null);
  const [covered, setCovered] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const target = useRef<HTMLElement | null>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();

  const go = useCallback(
    (next: number) => {
      writeTour({ id: state.id, step: next });
    },
    [state.id],
  );

  const finish = useCallback(() => {
    endTour();
    const previous = returnFocus.current;
    if (previous?.isConnected) {
      previous.focus({ preventScroll: true });
    }
  }, []);

  // Remember what had focus when the tour started.
  useEffect(() => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }, []);

  // A step the tour moved to (start, 上一步, 下一步) on another page: go
  // there. A route change by the reader does not trigger this.
  useEffect(() => {
    if (!stepAt(step, window.location.pathname) && step.href) {
      router.push(step.href);
    }
  }, [state.id, index]);

  // Find the element once the step's page is shown; say so when it never
  // comes. Off the step's page, pause after a short grace (a link the
  // reader followed may still be loading).
  useEffect(() => {
    target.current = null;
    setBox(null);
    if (!here) {
      setStatus("finding");
      const timer = window.setTimeout(() => setStatus("away"), PAUSE_GRACE);
      return () => window.clearTimeout(timer);
    }
    setStatus("finding");
    const started = Date.now();
    let timer = 0;
    const look = () => {
      const element = findTarget(name);
      if (element) {
        target.current = element;
        element.scrollIntoView({ block: "center", inline: "nearest" });
        setStatus("found");
        return;
      }
      if (Date.now() - started > FIND_TIMEOUT) {
        setStatus("missing");
        return;
      }
      timer = window.setTimeout(look, 150);
    };
    look();
    return () => window.clearTimeout(timer);
  }, [here, name, state.id, index]);

  // Follow the element while it moves (scrolling, layout, animations).
  useEffect(() => {
    if (status !== "found") {
      return;
    }
    let frame = 0;
    let previous: Box | null = null;
    const tick = () => {
      let element = target.current;
      if (!element?.isConnected) {
        element = findTarget(name);
        target.current = element;
      }
      setCovered(pageModalOpen());
      const next = element
        ? (() => {
            const r = element.getBoundingClientRect();
            return {
              top: Math.round(r.top),
              left: Math.round(r.left),
              width: Math.round(r.width),
              height: Math.round(r.height),
            };
          })()
        : null;
      if (!sameBox(previous, next)) {
        previous = next;
        setBox(next);
      }
      setViewport((current) =>
        current.width === window.innerWidth &&
        current.height === window.innerHeight
          ? current
          : { width: window.innerWidth, height: window.innerHeight },
      );
      frame = window.requestAnimationFrame(tick);
    };
    tick();
    return () => window.cancelAnimationFrame(frame);
  }, [status, name]);

  // Clicking the element of a step that leads on (a link) moves the tour
  // along; the link itself navigates.
  useEffect(() => {
    if (!step.follow || status !== "found" || last) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      const element = target.current;
      if (!element || !(event.target instanceof Element)) {
        return;
      }
      // Only the link counts (a card may hold other buttons).
      const link = event.target.closest("a");
      if (link && element.contains(link)) {
        go(index + 1);
      } else if (
        link === null &&
        element.closest("a")?.contains(event.target)
      ) {
        go(index + 1);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [step.follow, status, last, go, index]);

  // Esc ends the tour (unless a dialog of the page is on top).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pageModalOpen()) {
        event.preventDefault();
        finish();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [finish]);

  // Each new bubble takes the focus.
  useEffect(() => {
    if (status === "finding" || covered) {
      return;
    }
    primary.current?.focus({ preventScroll: true });
  }, [status, covered, index]);

  const next = () => {
    if (last) {
      finish();
      return;
    }
    const element = target.current;
    if (step.follow && element) {
      const link = element.closest("a") ?? element.querySelector("a");
      go(index + 1);
      if (link?.href && new URL(link.href).origin === window.location.origin) {
        const url = new URL(link.href);
        router.push(`${url.pathname}${url.search}${url.hash}`);
      } else {
        element.click();
      }
      return;
    }
    go(index + 1);
  };

  const back = () => {
    if (index > 0) {
      go(index - 1);
    }
  };

  const resume = () => {
    if (step.href) {
      router.push(step.href);
    } else if (index > 0) {
      go(index - 1);
    }
  };

  /** Tab and Shift+Tab stay inside the bubble. */
  const trap = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !bubble.current) {
      return;
    }
    const items = Array.from(
      bubble.current.querySelectorAll<HTMLElement>("button:not([disabled])"),
    );
    if (items.length === 0) {
      return;
    }
    const first = items[0];
    const end = items[items.length - 1];
    const active = document.activeElement;
    if (
      event.shiftKey &&
      (active === first || !items.includes(active as HTMLElement))
    ) {
      event.preventDefault();
      end.focus();
    } else if (
      !event.shiftKey &&
      (active === end || !items.includes(active as HTMLElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  };

  if (status === "finding" || covered) {
    return null;
  }

  const width = viewport.width || window.innerWidth;
  const height = viewport.height || window.innerHeight;
  const bubbleWidth = Math.min(isMobile ? width - 24 : 352, width - 24);

  let title = step.title;
  let body = isMobile && step.mobileBody ? step.mobileBody : step.body;
  if (status === "missing") {
    title = "這一步找不到要標示的地方";
    body = step.missing;
  } else if (status === "away") {
    title = "導覽暫停中";
    body = "你離開了導覽的頁面。要繼續嗎？";
  }

  // Where the bubble goes: under the element, else above it, else at the
  // bottom of the window; centred without a spotlight.
  const position: React.CSSProperties = { width: bubbleWidth };
  const spot = status === "found" && box ? box : null;
  if (spot) {
    const left = Math.min(
      Math.max(spot.left + spot.width / 2 - bubbleWidth / 2, 12),
      width - bubbleWidth - 12,
    );
    position.left = left;
    if (height - (spot.top + spot.height) >= BUBBLE_SPACE) {
      position.top = spot.top + spot.height + GAP;
    } else if (spot.top >= BUBBLE_SPACE) {
      position.bottom = height - spot.top + GAP;
    } else {
      position.bottom = 16;
    }
  } else {
    position.left = (width - bubbleWidth) / 2;
    position.top = Math.max(height / 2 - 110, 16);
  }

  const hole = spot
    ? {
        top: Math.max(spot.top - PAD, 4),
        left: Math.max(spot.left - PAD, 4),
        width:
          Math.min(spot.left + spot.width + PAD, width - 4) -
          Math.max(spot.left - PAD, 4),
        height:
          Math.min(spot.top + spot.height + PAD, height - 4) -
          Math.max(spot.top - PAD, 4),
      }
    : null;

  const buttonBase =
    "flex h-9 cursor-pointer items-center justify-center rounded-control px-3 font-semibold text-sm transition-colors disabled:cursor-default disabled:opacity-40";

  return (
    <>
      {hole ? (
        <div
          aria-hidden
          data-tour-spotlight
          className="pointer-events-none fixed z-[9990] rounded-[12px] transition-[top,left,width,height] duration-200"
          style={{
            ...hole,
            boxShadow:
              "0 0 0 3px rgba(255,255,255,0.95), 0 0 0 9999px rgba(17,29,41,0.5)",
          }}
        />
      ) : (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[9990] bg-ink-900/40"
        />
      )}
      <div
        ref={bubble}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        data-tour-bubble
        onKeyDown={trap}
        className="fixed z-[9991] rounded-card border border-line bg-surface p-4 shadow-card"
        style={position}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-brand-700 text-xs">
              {tour.title}・第 {index + 1} / {tour.steps.length} 步
            </p>
            <h2
              id={titleId}
              className="mt-1 font-bold text-base text-ink-900 leading-snug"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={finish}
            aria-label="結束導覽"
            className="-mt-1 -mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-500 hover:bg-field"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <p id={bodyId} className="mt-1.5 text-ink-700 text-sm leading-relaxed">
          {body}
        </p>
        <div className="mt-3 flex items-center gap-2">
          {status === "away" ? (
            <>
              <button
                type="button"
                onClick={finish}
                className={`${buttonBase} text-ink-700 hover:bg-field`}
              >
                結束
              </button>
              <button
                ref={primary}
                type="button"
                onClick={resume}
                className={`${buttonBase} ml-auto bg-brand-700 text-white hover:bg-brand-800`}
              >
                回到導覽
              </button>
            </>
          ) : (
            <>
              <button
                ref={status === "missing" ? primary : undefined}
                type="button"
                onClick={finish}
                className={`${buttonBase} text-ink-700 hover:bg-field`}
              >
                結束
              </button>
              <button
                type="button"
                onClick={back}
                disabled={index === 0}
                className={`${buttonBase} ml-auto border border-line-strong text-ink-700 hover:bg-field`}
              >
                上一步
              </button>
              {status === "missing" ? null : (
                <button
                  ref={primary}
                  type="button"
                  onClick={next}
                  className={`${buttonBase} bg-brand-700 text-white hover:bg-brand-800`}
                >
                  {last ? "完成" : "下一步"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

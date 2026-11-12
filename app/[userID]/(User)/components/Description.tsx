"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import Linkify from "@/components/Linkify/Linkify";
import { jumpOut } from "@/utils/jumpOut";

/**
 * Profile / SIG bio: three lines with a 「顯示更多」 toggle, instead of a
 * fixed-height box with a hidden inner scrollbar that cut text off.
 *
 * `fill`: the desktop side card gives the bio the remaining height; an
 * expanded bio scrolls inside it, and the toggle sits in the heading row so
 * three lines still fit on a 650px-high screen.
 */
export function Description({
  text,
  heading,
  fill = false,
}: {
  text?: string;
  /** Left side of the heading row (section title, edit button). */
  heading: ReactNode;
  fill?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) {
      return;
    }
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  const toggle = (overflowing || expanded) && (
    <button
      type="button"
      className={`flex shrink-0 cursor-pointer items-center font-semibold text-brand-700 text-sm hover:underline ${
        fill ? "ml-auto min-h-7" : "mt-1 min-h-10 self-start"
      }`}
      aria-expanded={expanded}
      onClick={() => setExpanded((value) => !value)}
    >
      {expanded ? "顯示較少" : "顯示更多"}
    </button>
  );

  return (
    <div className={fill ? "flex min-h-0 flex-1 flex-col" : ""}>
      <div className="mb-1 flex min-h-7 items-center gap-1.5">
        {heading}
        {fill && toggle}
      </div>
      <div
        ref={ref}
        className={`whitespace-pre-line break-words text-[0.95rem] text-ink-700 leading-[1.75] ${
          expanded
            ? fill
              ? "custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
              : ""
            : "line-clamp-3 shrink-0"
        }`}
      >
        {text ? (
          <Linkify
            componentDecorator={(decoratedHref, decoratedText, key) => (
              <button
                type="button"
                key={key}
                className="break-all text-left text-brand-700 hover:underline"
                onClick={() => jumpOut(decoratedHref)}
              >
                {decoratedText}
              </button>
            )}
          >
            {text}
          </Linkify>
        ) : (
          <span className="text-ink-400">尚未填寫</span>
        )}
      </div>
      {!fill && toggle}
    </div>
  );
}

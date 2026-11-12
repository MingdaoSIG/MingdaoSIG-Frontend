"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Linkify from "@/components/Linkify/Linkify";
import { jumpOut } from "@/utils/jumpOut";

/**
 * Profile / SIG bio: three lines with a 「顯示更多」 toggle, instead of a
 * fixed-height box with a hidden inner scrollbar that cut text off.
 *
 * `fill`: the desktop side card gives the bio the remaining height; an
 * expanded bio scrolls inside it.
 */
export function Description({
  text,
  fill = false,
}: {
  text?: string;
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

  return (
    <div className={fill ? "flex min-h-0 flex-1 flex-col" : ""}>
      <div
        ref={ref}
        className={`whitespace-pre-line break-words text-[0.95rem] text-ink-700 leading-[1.75] ${
          expanded
            ? fill
              ? "custom-scrollbar min-h-0 overflow-y-auto pr-1"
              : ""
            : "line-clamp-3"
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
      {(overflowing || expanded) && (
        <button
          type="button"
          className="mt-1 flex min-h-10 shrink-0 cursor-pointer items-center self-start font-semibold text-brand-700 text-sm hover:underline"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "顯示較少" : "顯示更多"}
        </button>
      )}
    </div>
  );
}

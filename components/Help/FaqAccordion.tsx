"use client";

import { ChevronDown, Link2 } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";
import type { FaqItem } from "@/modules/help/types";
import { HelpText } from "./HelpText";

// Questions that open in place (buttons with aria-expanded). With an
// `anchorPrefix`, each item has the id `<prefix><id>`: opening one puts
// it in the address bar, and a link with that hash opens and shows it.

export function FaqAccordion({
  items,
  anchorPrefix,
  renderQuestion,
  extra,
}: {
  items: FaqItem[];
  anchorPrefix?: string;
  /** Replaces the question text (search highlighting). */
  renderQuestion?: (item: FaqItem) => ReactNode;
  /** Something after an item's answer (role labels, links). */
  extra?: (item: FaqItem) => ReactNode;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const baseId = useId();

  // Open the item named by the hash, now and when the hash changes.
  useEffect(() => {
    if (!anchorPrefix) {
      return;
    }
    const fromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash.startsWith(anchorPrefix)) {
        return;
      }
      const id = hash.slice(anchorPrefix.length);
      if (!items.some((item) => item.id === id)) {
        return;
      }
      setOpen((current) => new Set(current).add(id));
      window.requestAnimationFrame(() => {
        document
          .getElementById(hash)
          ?.scrollIntoView({ block: "start", behavior: "auto" });
      });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [anchorPrefix, items]);

  const toggle = (id: string) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (anchorPrefix) {
          window.history.replaceState(
            window.history.state,
            "",
            `#${anchorPrefix}${id}`,
          );
        }
      }
      return next;
    });
  };

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-control border border-line">
      {items.map((item) => {
        const expanded = open.has(item.id);
        const panelId = `${baseId}-${item.id}`;
        const anchor = anchorPrefix ? `${anchorPrefix}${item.id}` : undefined;
        return (
          <li
            key={item.id}
            id={anchor}
            className="scroll-mt-4 bg-surface lg:scroll-mt-[var(--shell-top)]"
          >
            <h3 className="m-0">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left font-semibold text-[0.9375rem] text-ink-900 leading-6 hover:bg-field"
              >
                <span className="min-w-0 flex-1">
                  {renderQuestion ? renderQuestion(item) : item.q}
                </span>
                <ChevronDown
                  aria-hidden
                  className={`mt-1 size-4 shrink-0 text-ink-500 transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              hidden={!expanded}
              className="px-4 pb-4 text-[0.9375rem] text-ink-700 leading-[1.75]"
            >
              {item.a.map((paragraph) => (
                <p key={paragraph} className="mt-2 first:mt-0">
                  <HelpText text={paragraph} />
                </p>
              ))}
              {extra?.(item)}
              {anchor && (
                <p className="mt-3">
                  <a
                    href={`#${anchor}`}
                    className="inline-flex items-center gap-1 text-ink-500 text-xs hover:text-brand-700"
                  >
                    <Link2 aria-hidden className="size-3.5" />
                    這一題的連結
                  </a>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

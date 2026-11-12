"use client";

import { ListTree } from "lucide-react";
import { type RefObject, useEffect, useId, useState } from "react";

// 目錄 in the post page's side rail (decision 6C): the headings of the
// rendered post, with the one being read highlighted (scroll-spy). The
// Markdown renderer gives headings no ids, so they get `h-1`, `h-2`… here,
// which also makes `/post/<id>#h-3` open at that section.

export type PostHeading = { id: string; text: string; depth: number };

/** Line the reader's eye is on: headings above it count as read. */
const READ_LINE = 140;

const normalise = (text: string) => text.replace(/\s+/g, "").toLowerCase();

/**
 * The headings (h1–h3) of the post body under `root`, once `ready`
 * (the Markdown is in the DOM), and the id of the section being read.
 */
export function usePostHeadings(
  root: RefObject<HTMLElement | null>,
  ready: boolean,
  title: string,
) {
  const [headings, setHeadings] = useState<PostHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const body = root.current?.querySelector(".markdown");
    if (!ready || !body) {
      return;
    }
    const nodes = [...body.querySelectorAll("h1, h2, h3")].filter(
      (node, index) =>
        node.textContent?.trim() &&
        !node.classList.contains("dup-title") &&
        // The opening heading that repeats the title is hidden.
        !(
          index === 0 &&
          node === body.firstElementChild &&
          normalise(node.textContent ?? "") === normalise(title)
        ),
    );
    const levels = [...new Set(nodes.map((node) => node.tagName))].sort();
    const found = nodes.map((node, index) => {
      if (!node.id) {
        node.id = `h-${index + 1}`;
      }
      return {
        id: node.id,
        text: node.textContent?.trim() ?? "",
        depth: levels.indexOf(node.tagName),
      };
    });
    setHeadings(found);
    // A link to a section: go there now that it has its id.
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash && found.some((heading) => heading.id === hash)) {
      document.getElementById(hash)?.scrollIntoView({ block: "start" });
    }
  }, [ready, root, title]);

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = headings[0].id;
      for (const heading of headings) {
        const node = document.getElementById(heading.id);
        if (!node || node.getBoundingClientRect().top > READ_LINE) {
          break;
        }
        current = heading.id;
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };
    update();
    // The page scrolls inside its own block (or the document in reader
    // mode): listen in the capture phase to hear either.
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, [headings]);

  return { headings, activeId };
}

export function TableOfContents({
  headings,
  activeId,
  className = "",
}: {
  headings: PostHeading[];
  activeId: string | null;
  className?: string;
}) {
  const titleId = useId();
  // One heading is no outline.
  if (headings.length < 2) {
    return null;
  }
  return (
    <nav
      aria-labelledby={titleId}
      className={`flex min-h-0 flex-col rounded-card border border-line bg-surface py-3 shadow-card ${className}`}
      data-post-toc
    >
      <h2
        id={titleId}
        className="flex shrink-0 items-center gap-1.5 px-4 pb-1.5 font-bold text-ink-900 text-sm"
      >
        <ListTree aria-hidden className="size-4 text-ink-500" />
        目錄
      </h2>
      <ol className="custom-scrollbar flex max-h-[calc(100dvh-var(--shell-top,5.5rem)-4rem)] flex-col overflow-y-auto px-2">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={active ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  document
                    .getElementById(heading.id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  window.history.replaceState(null, "", `#${heading.id}`);
                }}
                className={`block rounded-control border-l-2 py-1.5 pr-2 text-[13px] leading-5 transition-colors ${
                  active
                    ? "border-brand-700 bg-brand-50 font-semibold text-brand-800"
                    : "border-transparent text-ink-700 hover:bg-field"
                }`}
                style={{ paddingLeft: `${0.625 + heading.depth * 0.75}rem` }}
              >
                <span className="line-clamp-2 break-words">{heading.text}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

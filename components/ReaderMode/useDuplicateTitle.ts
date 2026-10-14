"use client";

import { type RefObject, useEffect } from "react";

// Many posts (≈40% in a 748-post sample) open with a heading that repeats
// the post title. When the rendered body's first block is a heading whose
// text matches the title (ignoring whitespace), mark it so CSS can hide it.
// Nothing is removed from the content itself.

const normalise = (text: string) => text.replace(/\s+/g, "").toLowerCase();

export default function useDuplicateTitle(
  root: RefObject<HTMLElement | null>,
  title: string,
) {
  useEffect(() => {
    const container = root.current;
    if (!container) {
      return;
    }

    const mark = () => {
      const body = container.querySelector(".md-editor-preview");
      const first = body?.firstElementChild;
      if (!first) {
        return;
      }
      const isHeading = /^H[1-3]$/.test(first.tagName);
      const duplicate =
        isHeading &&
        normalise(first.textContent ?? "") === normalise(title ?? "");
      first.classList.toggle("dup-title", duplicate);
    };

    mark();
    // The preview renders its HTML after mount; re-check when it changes.
    const observer = new MutationObserver(mark);
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [root, title]);
}

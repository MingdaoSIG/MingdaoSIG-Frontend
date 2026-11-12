"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { renderMarkdown } from "@/modules/markdown";
import "katex/dist/katex.min.css";

// Renders post Markdown with the shared pipeline (modules/markdown).
// Used by both the post page and the editor preview, so they match.
//
// The HTML is sanitised inside renderMarkdown before it reaches the DOM.

export const MarkdownView = forwardRef<
  HTMLDivElement,
  {
    markdown: string;
    className?: string;
    /** Delay before re-rendering after `markdown` changes (editor preview). */
    debounceMs?: number;
    /** Called once the content (or the plain-text fallback) is in the DOM. */
    onReady?: () => void;
  }
>(function MarkdownView(
  { markdown, className = "", debounceMs = 0, onReady },
  ref,
) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  // Images in posts carry no width/height, so each one used to push the
  // text below it down when it loaded. Until an image loads it holds a
  // 16:9 box (most post images are photos), which keeps the shift small.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (html === null || !root) {
      return;
    }
    const cleanups: (() => void)[] = [];
    for (const img of root.querySelectorAll("img")) {
      if (img.complete) {
        continue;
      }
      img.classList.add("md-img-pending");
      const done = () => img.classList.remove("md-img-pending");
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      cleanups.push(() => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
      });
    }
    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [html]);

  useEffect(() => {
    if (html !== null || failed) {
      onReadyRef.current?.();
    }
  }, [html, failed]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const rendered = await renderMarkdown(markdown ?? "");
        if (!cancelled) {
          setHtml(rendered);
          setFailed(false);
        }
      } catch (error) {
        console.error("Markdown render failed:", error);
        if (!cancelled) {
          setFailed(true);
        }
      }
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [markdown, debounceMs]);

  // Rendering failed: show the text as written rather than a skeleton
  // that never goes away. React escapes it, so this is safe.
  if (failed) {
    return (
      <div
        ref={setRefs}
        className={`markdown whitespace-pre-wrap break-words ${className}`}
      >
        {markdown}
      </div>
    );
  }

  if (html === null) {
    return (
      <div ref={setRefs} className={`markdown ${className}`} aria-busy="true">
        <div className="flex animate-pulse flex-col gap-3">
          <div className="h-4 w-11/12 rounded-chip bg-ink-900/8" />
          <div className="h-4 w-10/12 rounded-chip bg-ink-900/8" />
          <div className="h-4 w-9/12 rounded-chip bg-ink-900/8" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setRefs}
      className={`markdown ${className}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised by rehype-sanitize in modules/markdown
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

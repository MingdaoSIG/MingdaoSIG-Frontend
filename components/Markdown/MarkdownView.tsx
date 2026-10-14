"use client";

import { forwardRef, useEffect, useState } from "react";
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
  }
>(function MarkdownView({ markdown, className = "", debounceMs = 0 }, ref) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const rendered = await renderMarkdown(markdown);
        if (!cancelled) {
          setHtml(rendered);
        }
      } catch (error) {
        console.error("Markdown render failed:", error);
      }
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [markdown, debounceMs]);

  if (html === null) {
    return (
      <div ref={ref} className={`markdown ${className}`} aria-busy="true">
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
      ref={ref}
      className={`markdown ${className}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised by rehype-sanitize in modules/markdown
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

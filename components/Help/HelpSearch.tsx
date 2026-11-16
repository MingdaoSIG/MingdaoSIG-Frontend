"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  type ReactNode,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type HelpHitKind,
  searchHelp,
  searchTerms,
} from "@/modules/help/search";

// The help centre's search box (table of contents and the 開始使用 hero):
// results show under the box as you type. ↓ moves into the results, Esc
// clears.

const KIND_LABEL: Record<HelpHitKind, string> = {
  guide: "教學",
  faq: "常見問題",
  page: "頁面",
};

/** Marks the query's words in a piece of text. */
export function Highlighted({
  text,
  terms,
}: {
  text: string;
  terms: string[];
}) {
  if (terms.length === 0) {
    return <>{text}</>;
  }
  const escaped = terms.map((term) =>
    term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) {
      parts.push(text.slice(last, at));
    }
    parts.push(
      <mark
        key={`${at}-${match[0]}`}
        className="rounded-[3px] bg-warm-50 px-0.5 text-ink-900"
      >
        {match[0]}
      </mark>,
    );
    last = at + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return <>{parts}</>;
}

export function HelpSearch({
  variant = "toc",
  onNavigate,
}: {
  variant?: "toc" | "hero";
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const hits = useMemo(() => searchHelp(query), [query]);
  const terms = useMemo(() => searchTerms(query), [query]);
  const hasQuery = terms.length > 0;

  const done = () => {
    setQuery("");
    onNavigate?.();
  };

  const links = () =>
    Array.from(listRef.current?.querySelectorAll<HTMLElement>("a") ?? []);

  const onInputKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      links()[0]?.focus();
    } else if (event.key === "Escape" && query) {
      event.preventDefault();
      event.stopPropagation();
      setQuery("");
    } else if (event.key === "Enter" && hits[0]) {
      event.preventDefault();
      router.push(hits[0].href);
      done();
    }
  };

  const onListKey = (event: KeyboardEvent<HTMLUListElement>) => {
    const items = links();
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[Math.min(at + 1, items.length - 1)]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (at <= 0) {
        inputRef.current?.focus();
      } else {
        items[at - 1]?.focus();
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setQuery("");
      inputRef.current?.focus();
    }
  };

  const hero = variant === "hero";

  return (
    <div className="relative" data-help-search={variant}>
      <div
        className={`flex items-center gap-2 rounded-control border border-line-strong bg-surface px-3 focus-within:border-brand-700 ${
          hero ? "h-12" : "h-10"
        }`}
      >
        <Search aria-hidden className="size-4 shrink-0 text-ink-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onInputKey}
          aria-label="搜尋教學與常見問題"
          aria-controls={hasQuery ? listId : undefined}
          placeholder="搜尋教學與常見問題"
          enterKeyHint="search"
          className={`min-w-0 flex-1 bg-transparent text-ink-900 outline-none placeholder:text-ink-400 [&::-webkit-search-cancel-button]:hidden ${
            hero ? "text-base" : "text-sm"
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="清除搜尋"
            className="-mr-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-500 hover:bg-field"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>
      {hasQuery && (
        <div
          className={
            hero ? "mt-2 rounded-control border border-line bg-surface" : "mt-2"
          }
        >
          <p aria-live="polite" className="px-3 pt-2 text-ink-500 text-xs">
            {hits.length > 0
              ? `找到 ${hits.length} 筆`
              : "找不到相關的說明，可以換個說法，或直接回報問題。"}
          </p>
          {hits.length > 0 && (
            <ul
              id={listId}
              ref={listRef}
              onKeyDown={onListKey}
              aria-label="搜尋結果"
              className="flex flex-col gap-0.5 p-1"
            >
              {hits.map((hit) => (
                <li key={hit.key}>
                  <Link
                    href={hit.href}
                    onClick={done}
                    data-help-hit={hit.kind}
                    className="block rounded-control px-2.5 py-2 hover:bg-field focus-visible:bg-field"
                  >
                    <span className="flex items-center gap-2">
                      <span className="shrink-0 rounded-chip bg-brand-50 px-1.5 font-semibold text-[11px] text-brand-800 leading-5">
                        {KIND_LABEL[hit.kind]}
                      </span>
                      <span className="min-w-0 truncate font-semibold text-ink-900 text-sm">
                        <Highlighted text={hit.title} terms={terms} />
                      </span>
                    </span>
                    {hit.snippet && (
                      <span className="mt-0.5 line-clamp-2 block text-ink-500 text-xs leading-5">
                        <Highlighted text={hit.snippet} terms={terms} />
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="px-3 pt-1 pb-2 text-xs">
            <Link
              href="/about/report"
              onClick={done}
              className="text-brand-700 underline decoration-brand-700/30 underline-offset-[0.2em] hover:text-brand-800"
            >
              找不到答案？回報問題
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { apiRequest } from "@/modules/api/client";
import { isSubmitEnter } from "@/utils/keyboard";

// 標籤 (v4 9B): a token input. Enter or a comma adds what is typed,
// Backspace in an empty box removes the last tag, at most five. While
// typing, existing tags with their post counts are suggested
// (`GET /post/hashtags/top?q=`, debounced) with 「新增「#…」」 last; under
// the box, 「這個 SIG 常用」 (`?sig=`).

export const TAG_LIMIT = 5;
const TAG_MAX_LENGTH = 20;
const SUGGEST_DELAY = 200;

type TagCount = { tag: string; count: number };

const clean = (text: string) =>
  text.trim().replace(/^#+/, "").trim().slice(0, TAG_MAX_LENGTH);
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function isTagCount(value: unknown): value is TagCount {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TagCount).tag === "string"
  );
}

async function topTags(
  query: Record<string, string | number>,
  signal: AbortSignal,
): Promise<TagCount[]> {
  const result = await apiRequest<unknown[]>("/post/hashtags/top", {
    query,
    signal,
  });
  return result.ok && Array.isArray(result.data)
    ? result.data.filter(isTagCount)
    : [];
}

export function TagInput({
  tags,
  onChange,
  sigId,
  mobile,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  sigId: string;
  mobile: boolean;
}) {
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const full = tags.length >= TAG_LIMIT;

  // Ask only after a short pause, and never for an empty box.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(clean(text)), SUGGEST_DELAY);
    return () => clearTimeout(timer);
  }, [text]);

  const suggested = useQuery({
    queryKey: ["tagSuggest", query],
    queryFn: ({ signal }) => topTags({ q: query, limit: 6 }, signal),
    enabled: query !== "",
    staleTime: 5 * 60 * 1000,
  });
  const popular = useQuery({
    queryKey: ["sigTopTags", sigId],
    queryFn: ({ signal }) => topTags({ sig: sigId, limit: 5 }, signal),
    enabled: Boolean(sigId),
    staleTime: 5 * 60 * 1000,
  });

  const typed = clean(text);
  const matches = (query && query === typed ? (suggested.data ?? []) : [])
    .filter((item) => !tags.some((tag) => same(tag, item.tag)))
    .slice(0, 6);
  const exact = matches.some((item) => same(item.tag, typed));
  const rows = [
    ...matches.map((item) => ({ key: item.tag, tag: item.tag, item })),
    ...(typed && !exact && !tags.some((tag) => same(tag, typed))
      ? [{ key: "__new", tag: typed, item: null }]
      : []),
  ];
  const showList = open && typed !== "" && rows.length > 0 && !full;

  useEffect(() => {
    setActive(-1);
  }, [query]);

  function add(...raw: string[]) {
    setText("");
    setOpen(false);
    const next = [...tags];
    for (const tag of raw.map(clean)) {
      if (tag && next.length < TAG_LIMIT && !next.some((t) => same(t, tag))) {
        next.push(tag);
      }
    }
    if (next.length !== tags.length) {
      onChange(next);
    }
  }

  function remove(tag: string) {
    onChange(tags.filter((item) => item !== tag));
    inputRef.current?.focus();
  }

  const extras = (popular.data ?? []).filter(
    (item) => !tags.some((tag) => same(tag, item.tag)),
  );

  return (
    <div className="flex flex-col gap-2" data-tag-input>
      <label htmlFor={inputId} className="font-semibold text-ink-900 text-sm">
        標籤{" "}
        <span className="font-normal text-ink-400 text-xs">
          最多 {TAG_LIMIT} 個
        </span>
      </label>
      <div className="relative">
        <div
          className={`flex w-full flex-wrap items-center gap-1.5 rounded-control border border-line bg-field px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand-700/30 ${
            mobile ? "min-h-11" : "min-h-10"
          }`}
          onClick={() => inputRef.current?.focus()}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex max-w-full items-center gap-0.5 rounded-chip bg-brand-50 py-0.5 pr-0.5 pl-2 font-medium text-brand-800 text-sm"
            >
              <span className="min-w-0 truncate">#{tag}</span>
              <button
                type="button"
                aria-label={`移除標籤 ${tag}`}
                onClick={(event) => {
                  event.stopPropagation();
                  remove(tag);
                }}
                className={`flex shrink-0 cursor-pointer items-center justify-center rounded-chip hover:bg-brand-700/15 ${
                  mobile ? "size-7" : "size-5"
                }`}
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </span>
          ))}
          {!full && (
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                showList && active >= 0 ? `${listId}-${active}` : undefined
              }
              value={text}
              maxLength={TAG_MAX_LENGTH + 1}
              onChange={(event) => {
                const value = event.target.value;
                // A comma (half or full width) ends a tag.
                if (/[,，、]/.test(value)) {
                  const parts = value.split(/[,，、]/);
                  add(...parts.slice(0, -1));
                  setText(parts.pop() ?? "");
                  return;
                }
                setText(value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" && showList) {
                  event.preventDefault();
                  setActive((index) => (index + 1) % rows.length);
                  return;
                }
                if (event.key === "ArrowUp" && showList) {
                  event.preventDefault();
                  setActive((index) =>
                    index <= 0 ? rows.length - 1 : index - 1,
                  );
                  return;
                }
                if (event.key === "Escape") {
                  setOpen(false);
                  return;
                }
                if (event.key === "Backspace" && text === "" && tags.length) {
                  event.preventDefault();
                  onChange(tags.slice(0, -1));
                  return;
                }
                if (event.key === "Enter") {
                  // Never submits; an Enter that picks an IME candidate
                  // must not add a half-typed tag.
                  event.preventDefault();
                  if (!isSubmitEnter(event, true)) {
                    return;
                  }
                  add(showList && active >= 0 ? rows[active].tag : text);
                }
              }}
              className={`min-w-[6rem] flex-1 bg-transparent px-1 text-ink-800 focus:outline-none ${
                mobile ? "h-8 text-[16px]" : "h-7 text-sm"
              }`}
            />
          )}
        </div>
        {showList && (
          <div
            id={listId}
            role="listbox"
            aria-label="標籤建議"
            className="absolute top-full right-0 left-0 z-20 mt-1 flex flex-col rounded-control border border-line bg-surface p-1 shadow-card-hover"
          >
            {rows.map((row, index) => (
              <div
                key={row.key}
                id={`${listId}-${index}`}
                role="option"
                tabIndex={-1}
                aria-selected={index === active}
                // Keeps the focus in the input, so the list stays open.
                onMouseDown={(event) => {
                  event.preventDefault();
                  add(row.tag);
                }}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-chip px-2.5 text-sm ${
                  mobile ? "min-h-11" : "min-h-8"
                } ${index === active ? "bg-brand-50 text-brand-800" : "text-ink-800 hover:bg-field"}`}
              >
                <span className="min-w-0 truncate">
                  {row.item ? `#${row.tag}` : `新增「#${row.tag}」`}
                </span>
                <span className="shrink-0 text-ink-500 text-xs">
                  {row.item ? `${row.item.count} 篇` : "Enter"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {extras.length > 0 && !full && (
        <div className="flex flex-wrap items-center gap-1.5 text-ink-500 text-xs">
          <span>這個 SIG 常用：</span>
          {extras.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => add(item.tag)}
              className={`cursor-pointer rounded-chip bg-field px-2 font-medium text-ink-700 hover:bg-brand-50 hover:text-brand-800 ${
                mobile ? "min-h-9" : "min-h-7"
              }`}
              aria-label={`加入標籤 ${item.tag}`}
            >
              #{item.tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

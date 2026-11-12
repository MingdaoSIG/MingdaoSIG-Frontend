"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BRAND_COLOR } from "@/modules/sigTheme";
import { useSigColor } from "@/modules/sigTheme/useSigColor";
import { type SigOption, useSigOptionsState } from "../shared/useSigOptions";

// 「發布到」 (v4 7B): colour chips for the SIGs the user may post in, the
// chosen one filled with its colour. With only one, it is chosen at once.
// With more than six, five chips and 「更多 SIG…」, which opens a
// searchable list. The rules are useSigOptions' (leaders post in their own
// SIGs, 公告 only for those who may post there).

const CHIPS = 6;

export function SigPicker({
  value,
  onChange,
  keepSigId,
  error,
  mobile,
}: {
  value: string;
  onChange: (sigId: string) => void;
  /** Edit mode: the SIG the post is already in (always offered). */
  keepSigId?: string;
  /** Shown under the chips after 發布 without a SIG. */
  error?: string | null;
  mobile: boolean;
}) {
  const state = useSigOptionsState(keepSigId);
  const options = state.options.filter((option) => option.allowed);
  const colorOf = useSigColor();
  const labelId = useId();
  const listId = useId();
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Only one SIG to post in: choose it (once the list is in, and the
  // login is known; before that 公告 alone looks like the only one).
  const only = state.loaded && options.length === 1 ? options[0].id : "";
  useEffect(() => {
    if (only && !value) {
      onChange(only);
    }
  }, [only, value]);

  useEffect(() => {
    if (moreOpen) {
      searchRef.current?.focus();
    }
  }, [moreOpen]);

  // More than six: five chips (the chosen one always among them) and 更多.
  const chips = useMemo(() => {
    if (options.length <= CHIPS) {
      return options;
    }
    const first = options.slice(0, CHIPS - 1);
    const chosen = options.find((option) => option.id === value);
    if (chosen && !first.includes(chosen)) {
      return [...first.slice(0, CHIPS - 2), chosen];
    }
    return first;
  }, [options, value]);
  const hasMore = options.length > CHIPS;
  const found = options.filter((option) =>
    option.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function pick(option: SigOption) {
    onChange(option.id);
    setMoreOpen(false);
    setQuery("");
  }

  const chipHeight = mobile ? "min-h-11" : "min-h-9";

  return (
    <div className="flex flex-col gap-2" data-sig-picker>
      <span id={labelId} className="font-semibold text-ink-900 text-sm">
        發布到
      </span>
      {state.loaded && options.length === 0 ? (
        <p className="text-ink-500 text-sm">
          你還沒有可以發文的 SIG，先到「探索」加入一個 SIG 吧。
        </p>
      ) : (
        <fieldset
          aria-labelledby={labelId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${labelId}-error` : undefined}
          className="flex flex-wrap gap-2"
        >
          {chips.map((option) => {
            const color = colorOf(option.id, BRAND_COLOR) ?? BRAND_COLOR;
            const on = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={on}
                onClick={() => pick(option)}
                className={`flex max-w-full cursor-pointer items-center gap-1.5 rounded-control border px-3 font-semibold text-sm transition-colors ${chipHeight} ${
                  on
                    ? "border-transparent text-white"
                    : "border-line-strong bg-surface text-ink-800 hover:bg-field"
                }`}
                style={
                  on
                    ? {
                        background: `color-mix(in srgb, ${color} 85%, #111d29)`,
                      }
                    : undefined
                }
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: on ? "#fff" : color }}
                />
                <span className="min-w-0 truncate">{option.name}</span>
              </button>
            );
          })}
          {hasMore && (
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls={listId}
              onClick={() => setMoreOpen((open) => !open)}
              className={`flex cursor-pointer items-center gap-1 rounded-control border border-line-strong border-dashed bg-surface px-3 font-semibold text-ink-700 text-sm hover:bg-field ${chipHeight}`}
            >
              更多 SIG…
              <ChevronDown
                aria-hidden
                className={`size-4 transition-transform ${moreOpen ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </fieldset>
      )}
      {hasMore && moreOpen && (
        <div
          id={listId}
          className="flex flex-col gap-1.5 rounded-control border border-line bg-surface p-2 shadow-card"
        >
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-400"
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setMoreOpen(false);
                }
              }}
              aria-label="搜尋 SIG"
              className={`w-full rounded-control border border-line bg-field pr-3 pl-8 text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-700/30 ${
                mobile ? "h-11 text-[16px]" : "h-9 text-sm"
              }`}
            />
          </div>
          <ul
            aria-label="所有可以發文的 SIG"
            className="custom-scrollbar flex max-h-56 flex-col overflow-y-auto"
          >
            {found.length === 0 && (
              <li className="px-2 py-2 text-ink-500 text-sm">找不到這個 SIG</li>
            )}
            {found.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => pick(option)}
                  aria-pressed={option.id === value}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-control px-2 text-left text-sm hover:bg-field ${
                    mobile ? "min-h-11" : "min-h-9"
                  } ${option.id === value ? "font-semibold text-brand-800" : "text-ink-800"}`}
                >
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      background: colorOf(option.id, BRAND_COLOR),
                    }}
                  />
                  <span className="min-w-0 flex-1 break-words">
                    {option.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <p
          id={`${labelId}-error`}
          role="alert"
          className="text-danger-700 text-sm"
        >
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { SEARCH_MAX_LENGTH } from "../api";
import { inputClass, selectClass } from "./ui";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      {children}
    </div>
  );
}

/**
 * A search box bound to a URL value. It commits 300 ms after typing
 * stops, and follows the URL when back / forward changes it.
 */
export function SearchBox({
  value,
  onCommit,
  label,
  placeholder,
  className = "",
}: {
  value: string;
  onCommit: (next: string) => void;
  label: string;
  placeholder: string;
  className?: string;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  const committed = useRef(value);

  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    const next = text.trim().slice(0, SEARCH_MAX_LENGTH);
    if (next === committed.current) {
      return;
    }
    const timer = setTimeout(() => {
      committed.current = next;
      onCommit(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <div className={`relative min-w-0 sm:w-72 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-400"
      />
      <input
        id={id}
        type="search"
        value={text}
        maxLength={SEARCH_MAX_LENGTH}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden`}
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText("");
            committed.current = "";
            onCommit("");
          }}
          aria-label="清除搜尋"
          className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-chip text-ink-400 hover:bg-line hover:text-ink-700"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export type Option = { value: string; label: string };

export function SelectFilter({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (next: string) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="font-semibold text-ink-500 text-xs">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${selectClass} appearance-none`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-500"
        />
      </div>
    </div>
  );
}

/** A removable chip for a filter set from elsewhere (a user, a post…). */
export function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex h-9 max-w-full items-center gap-1 rounded-control border border-brand-700/30 bg-brand-50 pr-1 pl-3 text-brand-800 text-sm">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`移除篩選：${label}`}
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-chip hover:bg-brand-700/10"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </span>
  );
}

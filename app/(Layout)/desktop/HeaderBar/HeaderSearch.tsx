"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { SEARCH_MAX_LENGTH, searchHref } from "@/modules/search";

/** Search box in the desktop header; Enter opens /search?q=. */
export default function HeaderSearch() {
  const router = useRouter();
  const path = usePathname();
  const [value, setValue] = useState("");

  // The search page has its own, larger search box.
  if (path === "/search") {
    return null;
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(searchHref(value));
    setValue("");
  }

  return (
    <search className="w-full min-w-0 max-w-[24rem]">
      <form onSubmit={onSubmit}>
        <label className="flex h-10 w-full items-center gap-2 rounded-control border border-line bg-field px-3 transition-colors focus-within:border-brand-700/40 focus-within:bg-surface focus-within:ring-2 focus-within:ring-brand-700/20 hover:border-line-strong">
          <Search size={16} className="shrink-0 text-ink-500" aria-hidden />
          <span className="sr-only">搜尋貼文</span>
          <input
            type="search"
            enterKeyHint="search"
            value={value}
            maxLength={SEARCH_MAX_LENGTH}
            onChange={(e) => setValue(e.target.value)}
            placeholder="搜尋貼文…"
            className="h-full min-w-0 flex-1 bg-transparent text-ink-900 text-sm placeholder:text-ink-400 focus:outline-none"
          />
        </label>
      </form>
    </search>
  );
}

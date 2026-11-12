"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import SplitBlock from "@/app/(Layout)/splitBlock";
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { TopTags } from "@/components/Tags/TopTags";
import {
  InfinityThreadsList as DesktopList,
  ThreadsListSkeleton as DesktopSkeleton,
} from "@/components/Threads/desktop/ThreadsList";
import {
  InfinityThreadsList as MobileList,
  ThreadsListSkeleton as MobileSkeleton,
} from "@/components/Threads/mobile/ThreadsList";
import { SEARCH_MAX_LENGTH, searchHref } from "@/modules/search";
import useIsMobile from "@/utils/useIsMobile";
import { useSearchPost } from "@/utils/usePost";

function SearchForm({
  q,
  mobile,
  autoFocus,
}: {
  q: string;
  mobile: boolean;
  autoFocus: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(q);
  const inputRef = useRef<HTMLInputElement>(null);

  // Back / forward and header searches change `q` under the form.
  useEffect(() => {
    setValue(q);
  }, [q]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = value.trim();
    if (next === q) {
      return;
    }
    router.push(searchHref(next));
    inputRef.current?.blur();
  }

  return (
    <search className="w-full">
      <form onSubmit={onSubmit} className="flex w-full gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-control border border-line-strong bg-surface px-3 focus-within:border-brand-700/50 focus-within:ring-2 focus-within:ring-brand-700/20">
          <Search size={18} className="shrink-0 text-ink-500" aria-hidden />
          <span className="sr-only">搜尋貼文</span>
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            value={value}
            maxLength={SEARCH_MAX_LENGTH}
            onChange={(e) => setValue(e.target.value)}
            placeholder="搜尋標題、內容或標籤"
            className={`h-11 min-w-0 flex-1 bg-transparent text-ink-900 placeholder:text-ink-400 focus:outline-none ${
              mobile ? "text-[16px]" : "text-[15px]"
            }`}
          />
        </label>
        <button
          type="submit"
          className="h-11 shrink-0 cursor-pointer rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
        >
          搜尋
        </button>
      </form>
    </search>
  );
}

function EmptyState({ mobile }: { mobile: boolean }) {
  return (
    <section
      className={`rounded-card border border-line bg-surface shadow-card ${
        mobile ? "p-4" : "p-6"
      }`}
    >
      <p className="text-ink-700 text-sm">
        輸入關鍵字，搜尋貼文的標題、內容和標籤。
      </p>
      <h2 className="mt-4 mb-3 font-bold text-base text-ink-900">熱門標籤</h2>
      <TopTags size={mobile ? "lg" : "md"} />
    </section>
  );
}

function NoResults({ q, mobile }: { q: string; mobile: boolean }) {
  return (
    <section
      className={`rounded-card border border-line bg-surface shadow-card ${
        mobile ? "p-4" : "p-6"
      }`}
    >
      <p className="font-semibold text-ink-900">找不到符合「{q}」的貼文</p>
      <p className="mt-1 text-ink-500 text-sm">
        換個關鍵字試試，或看看熱門標籤：
      </p>
      <div className="mt-4">
        <TopTags size={mobile ? "lg" : "md"} />
      </div>
    </section>
  );
}

/** /search?q=: posts whose title, hashtags or content contain q. */
export default function SearchPage() {
  const isMobile = useIsMobile();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().slice(0, SEARCH_MAX_LENGTH);
  const search = useSearchPost(q);
  const {
    data,
    total,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = search;
  const found = (data?.pages ?? []).reduce(
    (n, page) => n + (Array.isArray(page) ? page.length : 0),
    0,
  );
  const empty = Boolean(q) && !isLoading && !error && found === 0;

  const summary = q && !isLoading && !error && found > 0 && (
    <p className="px-1 text-ink-500 text-sm" aria-live="polite">
      「{q}」的搜尋結果，共 {total ?? found} 篇
    </p>
  );

  if (isMobile) {
    return (
      <div className="flex h-dvh flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="shrink-0 rounded-card border border-line bg-surface p-2 shadow-card">
          <SearchForm q={q} mobile autoFocus={!q} />
        </div>
        {summary}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!q ? (
            <EmptyState mobile />
          ) : empty ? (
            <NoResults q={q} mobile />
          ) : (
            <SectionErrorBoundary label="搜尋結果">
              {isLoading ? (
                <MobileSkeleton repeat={4} height="100%" />
              ) : (
                <MobileList
                  data={data}
                  height="100%"
                  fetchNextPage={fetchNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  error={error}
                  onRetry={() => refetch()}
                />
              )}
            </SectionErrorBoundary>
          )}
        </div>
      </div>
    );
  }

  return (
    <SplitBlock>
      <div className="flex flex-col gap-4">
        <header className="rounded-card border border-line bg-surface px-6 py-5 shadow-card">
          <h1 className="mb-3 font-bold text-2xl text-ink-900 leading-[1.4]">
            搜尋
          </h1>
          <SearchForm q={q} mobile={false} autoFocus={!q} />
        </header>
        {summary}
        {!q ? (
          <EmptyState mobile={false} />
        ) : empty ? (
          <NoResults q={q} mobile={false} />
        ) : (
          <SectionErrorBoundary label="搜尋結果">
            {isLoading ? (
              <DesktopSkeleton repeat={4} />
            ) : (
              <DesktopList
                data={data}
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
                error={error}
                onRetry={() => refetch()}
              />
            )}
          </SectionErrorBoundary>
        )}
      </div>
      <section className="glass shrink-0 rounded-card p-5">
        <h2 className="mb-3 font-bold text-base text-ink-900 leading-7">
          熱門標籤
        </h2>
        <TopTags />
      </section>
    </SplitBlock>
  );
}

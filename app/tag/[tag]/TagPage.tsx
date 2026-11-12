"use client";

import { Hash } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import SplitBlock from "@/app/(Layout)/splitBlock";
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import {
  InfiniteThreadList,
  type ThreadPage,
  useThreadPages,
} from "@/components/PostCard/InfiniteThreadList";
import { postListFetcher } from "@/components/PostCard/postListFetcher";
import { TopTags } from "@/components/Tags/TopTags";
import { postTags, tagHref } from "@/modules/hashtag";
import useIsMobile from "@/utils/useIsMobile";

const PAGE_SIZE = 10;
const RELATED_MAX = 8;

/** Tags that appear on the loaded posts together with this one. */
function relatedTags(pages: ThreadPage[] | undefined, tag: string) {
  const current = tag.toLowerCase();
  const counts = new Map<string, { tag: string; count: number }>();
  for (const page of pages ?? []) {
    for (const post of page.items ?? []) {
      for (const other of postTags(post.hashtag)) {
        const key = other.toLowerCase();
        if (key === current) {
          continue;
        }
        const entry = counts.get(key) ?? { tag: other, count: 0 };
        entry.count += 1;
        counts.set(key, entry);
      }
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, RELATED_MAX);
}

function TagChips({ tags }: { tags: { tag: string; count: number }[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map(({ tag }) => {
        const href = tagHref(tag);
        return href ? (
          <li key={tag} className="min-w-0 max-w-full">
            <Link
              href={href}
              className="block max-w-full truncate rounded-chip bg-brand-50 px-2.5 py-1 font-medium text-brand-800 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--color-brand-700)_16%,white)]"
            >
              #{tag}
            </Link>
          </li>
        ) : null;
      })}
    </ul>
  );
}

/**
 * Posts with one hashtag (/tag/[tag]), newest first, with the post count
 * and the tags that go with it (v3 2B: tag pages keep their own URL).
 */
export default function TagPage({ tag }: { tag: string }) {
  const isMobile = useIsMobile();
  const fetchPage = useMemo(
    () => postListFetcher(`/post/list/hashtag/${encodeURIComponent(tag)}`),
    [tag],
  );
  const query = useThreadPages(
    ["tagPosts", tag.toLowerCase()],
    fetchPage,
    PAGE_SIZE,
  );
  const total = query.data?.pages[0]?.total;
  const related = useMemo(
    () => relatedTags(query.data?.pages, tag),
    [query.data, tag],
  );
  const count =
    typeof total === "number" ? (
      <p data-tag-count className="text-ink-500 text-sm">
        {total.toLocaleString("zh-TW")} 篇貼文
      </p>
    ) : null;
  const empty = (
    <p className="rounded-card border border-line border-dashed bg-surface/60 px-6 py-12 text-center text-ink-500 text-sm">
      還沒有標記 #{tag} 的貼文
    </p>
  );

  if (isMobile) {
    return (
      <div className="flex h-full flex-col px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
          <header className="flex shrink-0 flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700">
                <Hash size={20} aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-bold text-ink-900 text-xl leading-7">
                  #{tag}
                </h1>
                {count}
              </div>
            </div>
            {related.length > 0 && (
              <section aria-label="相關標籤">
                <TagChips tags={related} />
              </section>
            )}
          </header>
          <SectionErrorBoundary label="貼文列表">
            <InfiniteThreadList
              query={query}
              empty={empty}
              label={`#${tag} 的貼文`}
            />
          </SectionErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <SplitBlock>
      <div className="flex flex-col gap-4">
        <header className="flex items-center gap-4 rounded-card border border-line bg-surface px-6 py-5 shadow-card">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700">
            <Hash size={22} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-ink-500 text-sm">標籤</p>
            <h1 className="truncate font-bold text-2xl text-ink-900 leading-[1.4]">
              #{tag}
            </h1>
          </div>
          <div className="ml-auto shrink-0">{count}</div>
        </header>
        <SectionErrorBoundary label="貼文列表">
          <InfiniteThreadList
            query={query}
            empty={empty}
            label={`#${tag} 的貼文`}
          />
        </SectionErrorBoundary>
      </div>
      <div className="custom-scrollbar flex min-h-0 flex-col gap-4 overflow-y-auto">
        {related.length > 0 && (
          <section className="glass shrink-0 rounded-card p-5">
            <h2 className="mb-3 font-bold text-base text-ink-900 leading-7">
              相關標籤
            </h2>
            <TagChips tags={related} />
          </section>
        )}
        <section className="glass shrink-0 rounded-card p-5">
          <h2 className="mb-3 font-bold text-base text-ink-900 leading-7">
            熱門標籤
          </h2>
          <TopTags current={tag} />
        </section>
      </div>
    </SplitBlock>
  );
}

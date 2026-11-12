"use client";

import Link from "next/link";

import { tagHref } from "@/modules/hashtag";
import { useTopTags } from "@/utils/usePost";

/**
 * The most used hashtags (contract v3 §4.4) as links to their /tag pages.
 * `current` marks the tag being viewed.
 */
export function TopTags({
  limit = 20,
  current,
  size = "md",
}: {
  limit?: number;
  current?: string;
  size?: "md" | "lg";
}) {
  const { data, isLoading, isError, refetch } = useTopTags(limit);
  const currentKey = current?.toLowerCase();

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2" aria-busy="true">
        {["w-16", "w-20", "w-12", "w-24", "w-14", "w-20"].map((width) => (
          <span
            key={width}
            className={`h-7 animate-pulse rounded-chip bg-field ${width}`}
          />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <p className="text-ink-500 text-sm">
        熱門標籤載入失敗。
        <button
          type="button"
          className="cursor-pointer font-semibold text-brand-700 hover:underline"
          onClick={() => refetch()}
        >
          重試
        </button>
      </p>
    );
  }
  if (!data || data.length === 0) {
    return <p className="text-ink-500 text-sm">還沒有標籤</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {data.map(({ tag, count }) => {
        const href = tagHref(tag);
        if (!href) {
          return null;
        }
        const active = tag.toLowerCase() === currentKey;
        return (
          <li key={tag}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-chip font-medium transition-colors ${
                size === "lg"
                  ? "min-h-10 px-3 text-[15px]"
                  : "px-2.5 py-1 text-sm"
              } ${
                active
                  ? "bg-brand-700 text-white"
                  : "bg-brand-50 text-brand-800 hover:bg-[color-mix(in_srgb,var(--color-brand-700)_16%,white)]"
              }`}
            >
              #{tag}
              <span
                className={`text-xs tabular-nums ${
                  active ? "text-white/80" : "text-ink-500"
                }`}
              >
                {count}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

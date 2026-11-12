"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Library } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { TPostSeries } from "@/interfaces/Thread";
import { getErrorMessage } from "@/modules/api/client";
import { useSeries } from "@/modules/series";

// The series box on a post page (contract v4 §4.4): which series, where
// this post sits, the previous and next post, and the whole list on
// demand. A post may be in more than one series; each gets a box.

function SeriesList({ id, postId }: { id: string; postId: string }) {
  const { data, isPending, error, refetch } = useSeries(id);
  if (isPending) {
    return <p className="px-1 py-2 text-ink-500 text-sm">載入中…</p>;
  }
  if (error || !data) {
    return (
      <p role="alert" className="px-1 py-2 text-ink-500 text-sm">
        {getErrorMessage(error)}{" "}
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
  return (
    <ol className="flex flex-col gap-0.5">
      {data.posts.map((post, index) => {
        const item = typeof post === "string" ? { _id: post, title: "" } : post;
        const current = item._id === postId;
        return (
          <li key={item._id}>
            <Link
              href={`/post/${item._id}`}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-9 items-baseline gap-2 rounded-control px-2 py-1.5 text-sm leading-6 transition-colors ${
                current
                  ? "bg-brand-50 font-semibold text-brand-800"
                  : "text-ink-700 hover:bg-field"
              }`}
            >
              <span className="w-5 shrink-0 text-right text-ink-500 text-xs tabular-nums">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {item.title || "（無標題）"}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function SeriesBox({
  series,
  postId,
  mobile,
}: {
  series: TPostSeries;
  postId: string;
  mobile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const position = Math.min(series.index + 1, Math.max(series.total, 1));
  const step = `flex min-w-0 flex-1 items-center gap-1.5 rounded-control border border-line px-2.5 text-sm transition-colors ${
    mobile ? "min-h-11" : "min-h-9 hover:bg-field"
  }`;

  return (
    <section
      aria-label={`系列：${series.title}`}
      className="flex flex-col gap-2"
      data-series={series._id}
    >
      <div className="flex items-center gap-2">
        <Library aria-hidden className="size-4 shrink-0 text-brand-700" />
        <Link
          href={`/series/${series._id}`}
          className="min-w-0 flex-1 truncate font-semibold text-ink-900 text-sm hover:underline"
        >
          {series.title || "未命名的系列"}
        </Link>
        <span className="shrink-0 text-ink-500 text-xs tabular-nums">
          第 {position} / {series.total} 篇
        </span>
      </div>
      <div className="flex gap-2">
        {series.prev ? (
          <Link
            href={`/post/${series.prev._id}`}
            className={`${step} text-ink-800`}
            aria-label={`上一篇：${series.prev.title}`}
          >
            <ChevronLeft aria-hidden className="size-4 shrink-0" />
            <span className="truncate">{series.prev.title || "上一篇"}</span>
          </Link>
        ) : (
          <span className={`${step} text-ink-400`} aria-disabled>
            <ChevronLeft aria-hidden className="size-4 shrink-0" />
            已是第一篇
          </span>
        )}
        {series.next ? (
          <Link
            href={`/post/${series.next._id}`}
            className={`${step} justify-end text-ink-800`}
            aria-label={`下一篇：${series.next.title}`}
          >
            <span className="truncate">{series.next.title || "下一篇"}</span>
            <ChevronRight aria-hidden className="size-4 shrink-0" />
          </Link>
        ) : (
          <span className={`${step} justify-end text-ink-400`} aria-disabled>
            已是最後一篇
            <ChevronRight aria-hidden className="size-4 shrink-0" />
          </span>
        )}
      </div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex cursor-pointer items-center gap-1 self-start font-semibold text-brand-700 text-xs hover:underline ${
          mobile ? "min-h-10" : "h-7"
        }`}
      >
        <ChevronDown
          aria-hidden
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
        {open ? "收合列表" : `查看全部 ${series.total} 篇`}
      </button>
      {open && <SeriesList id={series._id} postId={postId} />}
    </section>
  );
}

export function SeriesNav({
  series,
  postId,
  variant,
  className = "",
}: {
  series: TPostSeries[] | undefined;
  postId: string;
  variant: "desktop" | "mobile";
  className?: string;
}) {
  const list = (series ?? []).filter(
    (item) => item && typeof item._id === "string",
  );
  if (list.length === 0) {
    return null;
  }
  const mobile = variant === "mobile";
  return (
    <div
      data-reader-hide
      className={`flex flex-col gap-4 ${
        mobile
          ? "rounded-card border border-line bg-surface px-3 py-3 shadow-card"
          : "glass rounded-card px-5 py-4"
      } ${className}`}
    >
      {list.map((item) => (
        <SeriesBox
          key={item._id}
          series={item}
          postId={postId}
          mobile={mobile}
        />
      ))}
    </div>
  );
}

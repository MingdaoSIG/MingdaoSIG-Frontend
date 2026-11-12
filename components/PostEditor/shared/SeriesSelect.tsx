"use client";

import Link from "next/link";
import { useId } from "react";
import type { TSeries } from "@/interfaces/Reading";
import {
  seriesCount,
  seriesPostIds,
  updateSeries,
  useUserSeries,
} from "@/modules/series";
import { useUserAccount } from "@/utils/useUserAccount";

// 「加入系列」 in the editor (contract v4 §4.4): optional; the post is
// appended to the chosen series once it is published or updated.

/** Appends the post to the series (no-op when it is already in it). */
export async function addPostToSeries(series: TSeries, postId: string) {
  const ids = seriesPostIds(series);
  if (ids.includes(postId)) {
    return { ok: true as const };
  }
  return updateSeries(series._id, { posts: [...ids, postId] });
}

export function SeriesSelect({
  value,
  onChange,
  postId,
  mobile = false,
}: {
  /** The chosen series id, or "" for none. */
  value: string;
  onChange: (id: string) => void;
  /** Edit mode: series that already hold the post are listed as such. */
  postId?: string;
  mobile?: boolean;
}) {
  const { isLogin, userData } = useUserAccount();
  const userId = isLogin ? (userData?._id ?? "") : "";
  const series = useUserSeries(userId || null);
  const id = useId();
  if (!userId) {
    return null;
  }
  const list = series.data ?? [];
  const holding = postId
    ? list.filter((item) => seriesPostIds(item).includes(postId))
    : [];
  const options = list.filter((item) => !holding.includes(item));

  return (
    <div className="flex flex-col gap-1.5" data-series-select>
      <label htmlFor={id} className="font-semibold text-base text-ink-900">
        加入系列
      </label>
      {holding.length > 0 && (
        <p className="text-ink-500 text-xs">
          已在：{holding.map((item) => item.title).join("、")}
        </p>
      )}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={series.isPending}
        className={`w-full cursor-pointer rounded-control border border-line bg-field px-3 text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-700/30 ${
          mobile ? "h-11 text-[16px]" : "h-9 text-sm"
        }`}
      >
        <option value="">
          {series.isPending
            ? "載入中…"
            : options.length > 0
              ? "不加入系列"
              : "沒有可加入的系列"}
        </option>
        {options.map((item) => (
          <option key={item._id} value={item._id}>
            {item.title || "未命名的系列"}（{seriesCount(item)} 篇）
          </option>
        ))}
      </select>
      <p className="text-ink-500 text-xs leading-5">
        {series.isError
          ? "系列載入失敗，發布後可以到個人頁面的「系列」加入。"
          : "發布後會排在系列最後。"}
        {userData?.customId && (
          <>
            {" "}
            <Link
              href={`/@${userData.customId}?tab=series`}
              className="font-semibold text-brand-700 hover:underline"
            >
              管理系列
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Library, Plus, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { TSeries } from "@/interfaces/Reading";
import {
  createSeries,
  SERIES_TITLE_MAX,
  seriesCount,
  seriesKeys,
  seriesPostIds,
  toSeries,
  useSeries,
  useUserSeries,
} from "@/modules/series";
import { useUserAccount } from "@/utils/useUserAccount";

// 加入系列 (v4 10B): a searchable list of your series with 「＋ 建立新系列」
// at the bottom (named and chosen without leaving the editor), and a box
// with the series in order and where this post goes (「這篇會是第 N 篇」).
// Editing a post that is already in a series shows its real place. The
// post is appended after publishing (`addPostToSeries` on the page).

export function SeriesPicker({
  value,
  onChange,
  postId,
  title,
  mobile,
}: {
  /** The chosen series id, or "" for none. */
  value: string;
  onChange: (id: string) => void;
  /** Edit mode: the post, which may already be in a series. */
  postId?: string;
  /** This post's title, for the order box. */
  title: string;
  mobile: boolean;
}) {
  const { isLogin, userData } = useUserAccount();
  const userId = isLogin ? (userData?._id ?? "") : "";
  const series = useUserSeries(userId || null);
  const client = useQueryClient();
  const labelId = useId();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const newTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) {
      newTitleRef.current?.focus();
    }
  }, [creating]);

  const list = series.data ?? [];
  const holding = postId
    ? list.find((item) => seriesPostIds(item).includes(postId))
    : undefined;
  // Nothing chosen while editing: show the series the post is already in.
  const shownId = value || holding?._id || "";
  const chosen = list.find((item) => item._id === shownId);
  const found = list.filter((item) =>
    (item.title || "").toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    searchRef.current?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  if (!userId) {
    return null;
  }

  function choose(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
    setCreating(false);
  }

  async function create() {
    const name = newTitle.trim();
    if (!name) {
      setCreateError("請輸入系列名稱");
      return;
    }
    setBusy(true);
    setCreateError(null);
    const result = await createSeries({ title: name });
    setBusy(false);
    const created = result.ok ? toSeries(result.data) : null;
    if (!result.ok || !created) {
      setCreateError(result.ok ? "建立失敗，請稍後再試" : result.message);
      return;
    }
    client.setQueryData<TSeries[]>(seriesKeys.ofUser(userId), (old) => [
      created,
      ...(old ?? []),
    ]);
    void client.invalidateQueries({ queryKey: seriesKeys.ofUser(userId) });
    setNewTitle("");
    choose(created._id);
  }

  const row = mobile ? "min-h-11" : "min-h-9";

  return (
    <div ref={rootRef} className="flex flex-col gap-2" data-series-picker>
      <span id={labelId} className="font-semibold text-ink-900 text-sm">
        加入系列
      </span>
      <div className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={labelId}
          aria-describedby={`${labelId}-value`}
          disabled={series.isPending}
          onClick={() => setOpen((value) => !value)}
          className={`flex w-full cursor-pointer items-center gap-2 rounded-control border border-line bg-field px-3 text-left text-ink-800 text-sm hover:bg-brand-50 disabled:cursor-wait ${row}`}
        >
          <Library aria-hidden className="size-4 shrink-0 text-ink-500" />
          <span id={`${labelId}-value`} className="min-w-0 flex-1 truncate">
            {series.isPending
              ? "載入中…"
              : chosen
                ? chosen.title || "未命名的系列"
                : "不加入系列"}
          </span>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-ink-500" />
        </button>
        {open && (
          <div className="absolute top-full right-0 left-0 z-20 mt-1 flex flex-col gap-1 rounded-control border border-line bg-surface p-1.5 shadow-card-hover">
            {list.length > 4 && (
              <div className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-400"
                />
                <input
                  ref={searchRef}
                  type="search"
                  aria-label="搜尋系列"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setOpen(false);
                    }
                  }}
                  className={`w-full rounded-control border border-line bg-field pr-3 pl-8 text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-700/30 ${
                    mobile ? "h-11 text-[16px]" : "h-9 text-sm"
                  }`}
                />
              </div>
            )}
            <ul
              id={listId}
              aria-label="你的系列"
              className="custom-scrollbar flex max-h-56 flex-col overflow-y-auto"
            >
              {!holding && (
                <li>
                  <button
                    type="button"
                    onClick={() => choose("")}
                    aria-pressed={!shownId}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-chip px-2 text-left text-ink-700 text-sm hover:bg-field ${row}`}
                  >
                    <span className="min-w-0 flex-1">不加入系列</span>
                    {!shownId && <Check aria-hidden className="size-4" />}
                  </button>
                </li>
              )}
              {found.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() =>
                      choose(item._id === holding?._id ? "" : item._id)
                    }
                    aria-pressed={item._id === shownId}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-chip px-2 text-left text-sm hover:bg-field ${row} ${
                      item._id === shownId
                        ? "font-semibold text-brand-800"
                        : "text-ink-800"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {item.title || "未命名的系列"}
                    </span>
                    <span className="shrink-0 text-ink-500 text-xs">
                      {seriesCount(item)} 篇
                    </span>
                    {item._id === shownId && (
                      <Check aria-hidden className="size-4 shrink-0" />
                    )}
                  </button>
                </li>
              ))}
              {query && found.length === 0 && (
                <li className="px-2 py-2 text-ink-500 text-sm">
                  沒有符合的系列
                </li>
              )}
            </ul>
            <div className="border-line border-t pt-1">
              {creating ? (
                <div className="flex flex-col gap-1.5 p-1">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      aria-label="新系列名稱"
                      value={newTitle}
                      maxLength={SERIES_TITLE_MAX}
                      ref={newTitleRef}
                      onChange={(event) => setNewTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          if (!event.nativeEvent.isComposing) {
                            void create();
                          }
                        }
                        if (event.key === "Escape") {
                          setCreating(false);
                        }
                      }}
                      aria-invalid={Boolean(createError) || undefined}
                      className={`min-w-0 flex-1 rounded-control border bg-field px-3 text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-700/30 ${
                        createError ? "border-danger-700" : "border-line"
                      } ${mobile ? "h-11 text-[16px]" : "h-9 text-sm"}`}
                    />
                    <button
                      type="button"
                      onClick={() => void create()}
                      disabled={busy}
                      className={`shrink-0 cursor-pointer rounded-control bg-brand-700 px-3 font-semibold text-sm text-white hover:bg-brand-800 disabled:opacity-60 ${row}`}
                    >
                      {busy ? "建立中…" : "建立"}
                    </button>
                  </div>
                  {createError && (
                    <p role="alert" className="text-danger-700 text-xs">
                      {createError}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className={`flex w-full cursor-pointer items-center gap-1.5 rounded-chip px-2 font-semibold text-brand-700 text-sm hover:bg-brand-50 ${row}`}
                >
                  <Plus aria-hidden className="size-4" />
                  建立新系列
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {series.isError && (
        <p className="text-ink-500 text-xs">
          系列載入失敗，發布後可以到個人頁面的「系列」加入。
        </p>
      )}
      {chosen && <SeriesOrder series={chosen} postId={postId} title={title} />}
    </div>
  );
}

/** The series in order, with this post in its place (or at the end). */
function SeriesOrder({
  series,
  postId,
  title,
}: {
  series: TSeries;
  postId?: string;
  title: string;
}) {
  const detail = useSeries(series._id);
  const posts = (detail.data?.posts ?? []).map((post) =>
    typeof post === "string" ? { _id: post, title: "" } : post,
  );
  const index = postId ? posts.findIndex((post) => post._id === postId) : -1;
  const inSeries = index >= 0;
  const rows = inSeries
    ? posts
    : [...posts, { _id: "__this", title: title || "（這篇）" }];
  const position = inSeries ? index + 1 : rows.length;

  return (
    <div
      className="flex flex-col gap-1.5 rounded-control border border-line bg-field/60 px-3 py-2"
      data-series-order
    >
      <p className="text-ink-700 text-sm">
        {inSeries ? "這篇是" : "這篇會是"}
        <b className="mx-1 text-ink-900">第 {position} 篇</b>
      </p>
      {detail.isPending ? (
        <p className="text-ink-500 text-xs">載入中…</p>
      ) : (
        <ol className="flex max-h-40 flex-col gap-0.5 overflow-y-auto text-xs">
          {rows.map((post, i) => {
            const me = post._id === "__this" || post._id === postId;
            return (
              <li
                key={post._id}
                className={`flex gap-2 ${me ? "font-semibold text-brand-800" : "text-ink-700"}`}
              >
                <span className="w-4 shrink-0 text-right tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {me ? `（這篇）${title || ""}` : post.title || "（無標題）"}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

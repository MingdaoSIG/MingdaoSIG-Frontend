"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Library,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import Swal from "sweetalert2";
import type { TSeries } from "@/interfaces/Reading";
import type { TThread } from "@/interfaces/Thread";
import { ApiError, apiRequest, getErrorMessage } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import {
  createSeries,
  deleteSeries,
  SERIES_DESCRIPTION_MAX,
  SERIES_TITLE_MAX,
  seriesCount,
  seriesKeys,
  updateSeries,
  useUserSeries,
} from "@/modules/series";
import { notice } from "@/utils/notice";

// 「系列」 on a profile (contract v4 §4.4). Your own profile manages them:
// create, rename, add and remove posts, and reorder. Someone else's lists
// their series to read.

const OWN_POSTS_LIMIT = 100;

function useOwnPosts(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["userPost", userId, "series-picker"],
    queryFn: async ({ signal }) => {
      const result = await apiRequest<TThread[]>(
        `/post/list/user/${encodeURIComponent(userId)}`,
        { query: { skip: 0, limit: OWN_POSTS_LIMIT, sort: "latest" }, signal },
      );
      if (!result.ok) {
        throw new ApiError(result);
      }
      return Array.isArray(result.data)
        ? result.data.filter((post) => typeof post?._id === "string")
        : [];
    },
    enabled: enabled && Boolean(userId),
    staleTime: 60 * 1000,
  });
}

function seriesError(result: { status: number | null; message: string }) {
  if (result.status === CustomStatus.INVALID_BODY) {
    return "資料格式不正確，請確認標題（1–60 字）與說明（300 字內）";
  }
  if (result.status === CustomStatus.FORBIDDEN) {
    return "只能管理自己的系列和自己的貼文";
  }
  return result.message;
}

const inputClass =
  "w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-ink-900 placeholder:text-ink-400 focus:border-brand-700/50 focus:outline-none focus:ring-2 focus:ring-brand-700/20";

function TitleFields({
  title,
  description,
  onTitle,
  onDescription,
  mobile,
}: {
  title: string;
  description: string;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  mobile: boolean;
}) {
  const titleId = useId();
  const descId = useId();
  const size = mobile ? "text-[16px]" : "text-sm";
  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor={titleId} className="font-semibold text-ink-800 text-sm">
          系列名稱
        </label>
        <input
          id={titleId}
          value={title}
          maxLength={SERIES_TITLE_MAX + 10}
          onChange={(event) => onTitle(event.target.value)}
          placeholder="例如：機器人社課筆記"
          className={`${inputClass} ${size}`}
        />
        <span
          className={`self-end text-xs tabular-nums ${
            title.length > SERIES_TITLE_MAX ? "text-danger-700" : "text-ink-500"
          }`}
        >
          {title.length}/{SERIES_TITLE_MAX}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={descId} className="font-semibold text-ink-800 text-sm">
          說明（選填）
        </label>
        <textarea
          id={descId}
          value={description}
          rows={2}
          onChange={(event) => onDescription(event.target.value)}
          className={`${inputClass} ${size} resize-none leading-[1.6]`}
        />
        <span
          className={`self-end text-xs tabular-nums ${
            description.length > SERIES_DESCRIPTION_MAX
              ? "text-danger-700"
              : "text-ink-500"
          }`}
        >
          {description.length}/{SERIES_DESCRIPTION_MAX}
        </span>
      </div>
    </>
  );
}

function validTitle(title: string, description: string) {
  const trimmed = title.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= SERIES_TITLE_MAX &&
    description.length <= SERIES_DESCRIPTION_MAX
  );
}

function CreateForm({
  mobile,
  onDone,
  onCancel,
}: {
  mobile: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ok = validTitle(title, description);

  async function save() {
    if (!ok || saving) {
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createSeries({
      title: title.trim(),
      description: description.trim(),
      posts: [],
    });
    setSaving(false);
    if (!result.ok) {
      setError(`沒有建立：${seriesError(result)}`);
      return;
    }
    notice("success", "已建立系列");
    onDone();
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-card border border-brand-700/30 bg-surface p-4 shadow-card"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      aria-label="新增系列"
    >
      <TitleFields
        title={title}
        description={description}
        onTitle={setTitle}
        onDescription={setDescription}
        mobile={mobile}
      />
      {error && (
        <p role="alert" className="text-danger-700 text-sm">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={`cursor-pointer rounded-control border border-line-strong bg-surface px-4 font-semibold text-ink-700 text-sm hover:bg-field ${
            mobile ? "h-11" : "h-9"
          }`}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!ok || saving}
          className={`cursor-pointer rounded-control bg-brand-700 px-4 font-semibold text-sm text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 ${
            mobile ? "h-11" : "h-9"
          }`}
        >
          {saving ? "建立中…" : "建立"}
        </button>
      </div>
    </form>
  );
}

type PostRef = { _id: string; title: string };

function postRefs(series: TSeries, titles: Map<string, string>): PostRef[] {
  return series.posts.map((post) => {
    if (typeof post === "string") {
      return { _id: post, title: titles.get(post) ?? "" };
    }
    return {
      _id: post._id ?? "",
      title: post.title || titles.get(post._id ?? "") || "",
    };
  });
}

function SeriesEditor({
  series,
  ownPosts,
  ownPostsError,
  mobile,
  onDone,
  onCancel,
}: {
  series: TSeries;
  ownPosts: TThread[];
  ownPostsError: string | null;
  mobile: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const titles = useMemo(
    () => new Map(ownPosts.map((post) => [post._id ?? "", post.title])),
    [ownPosts],
  );
  const [title, setTitle] = useState(series.title);
  const [description, setDescription] = useState(series.description ?? "");
  const [posts, setPosts] = useState<PostRef[]>(() => postRefs(series, titles));
  const [adding, setAdding] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pickId = useId();
  const ok = validTitle(title, description);
  const inSeries = new Set(posts.map((post) => post._id));
  const candidates = ownPosts.filter((post) => !inSeries.has(post._id ?? ""));
  const button = `flex shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-700 transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-30 ${
    mobile ? "size-11" : "size-8"
  }`;

  function move(index: number, step: -1 | 1) {
    setPosts((current) => {
      const next = current.slice();
      const target = index + step;
      if (target < 0 || target >= next.length) {
        return current;
      }
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function add() {
    const post = ownPosts.find((item) => item._id === adding);
    if (!post?._id) {
      return;
    }
    setPosts((current) => [
      ...current,
      { _id: post._id ?? "", title: post.title },
    ]);
    setAdding("");
  }

  async function save() {
    if (!ok || saving) {
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateSeries(series._id, {
      title: title.trim(),
      description: description.trim(),
      posts: posts.map((post) => post._id),
    });
    setSaving(false);
    if (!result.ok) {
      setError(`沒有儲存：${seriesError(result)}`);
      return;
    }
    notice("success", "已儲存系列");
    onDone();
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      aria-label={`編輯系列：${series.title}`}
    >
      <TitleFields
        title={title}
        description={description}
        onTitle={setTitle}
        onDescription={setDescription}
        mobile={mobile}
      />
      <div className="flex flex-col gap-1.5">
        <p className="font-semibold text-ink-800 text-sm">
          文章順序（{posts.length} 篇）
        </p>
        {posts.length === 0 ? (
          <p className="rounded-control bg-field px-3 py-2 text-ink-500 text-sm">
            還沒有文章，從下方加入。
          </p>
        ) : (
          <ol className="flex flex-col gap-1">
            {posts.map((post, index) => (
              <li
                key={post._id}
                className="flex items-center gap-1 rounded-control border border-line bg-surface py-1 pr-1 pl-2.5"
              >
                <span className="w-5 shrink-0 text-ink-500 text-xs tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink-800 text-sm">
                  {post.title || "（找不到這篇貼文的標題）"}
                </span>
                <button
                  type="button"
                  className={button}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`上移：${post.title}`}
                >
                  <ArrowUp aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  className={button}
                  disabled={index === posts.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`下移：${post.title}`}
                >
                  <ArrowDown aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  className={`${button} hover:text-danger-700`}
                  onClick={() =>
                    setPosts((current) =>
                      current.filter((item) => item._id !== post._id),
                    )
                  }
                  aria-label={`移出系列：${post.title}`}
                >
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={pickId} className="font-semibold text-ink-800 text-sm">
          加入文章
        </label>
        {ownPostsError ? (
          <p className="text-danger-700 text-sm">
            你的貼文載入失敗：{ownPostsError}
          </p>
        ) : (
          <div className="flex gap-2">
            <select
              id={pickId}
              value={adding}
              onChange={(event) => setAdding(event.target.value)}
              className={`${inputClass} min-w-0 flex-1 cursor-pointer ${
                mobile ? "h-11 text-[16px]" : "h-9 py-0 text-sm"
              }`}
            >
              <option value="">
                {candidates.length > 0
                  ? "選擇一篇你的貼文…"
                  : "沒有可以加入的貼文"}
              </option>
              {candidates.map((post) => (
                <option key={post._id} value={post._id}>
                  {post.title || "（無標題）"}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={add}
              disabled={!adding}
              className={`flex shrink-0 cursor-pointer items-center gap-1 rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-800 text-sm hover:bg-field disabled:cursor-not-allowed disabled:opacity-50 ${
                mobile ? "h-11" : "h-9"
              }`}
            >
              <Plus aria-hidden className="size-4" />
              加入
            </button>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="text-danger-700 text-sm">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={`cursor-pointer rounded-control border border-line-strong bg-surface px-4 font-semibold text-ink-700 text-sm hover:bg-field ${
            mobile ? "h-11" : "h-9"
          }`}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!ok || saving}
          className={`cursor-pointer rounded-control bg-brand-700 px-4 font-semibold text-sm text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 ${
            mobile ? "h-11" : "h-9"
          }`}
        >
          {saving ? "儲存中…" : "儲存"}
        </button>
      </div>
    </form>
  );
}

function SeriesCard({
  series,
  manage,
  editing,
  onEdit,
  onDelete,
  children,
  mobile,
}: {
  series: TSeries;
  manage: boolean;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
  mobile: boolean;
}) {
  const count = seriesCount(series);
  const icon = `flex shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-500 transition-colors hover:bg-field hover:text-ink-900 ${
    mobile ? "size-11" : "size-8"
  }`;
  return (
    <li
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
      data-series-card={series._id}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-800">
          <Library aria-hidden className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/series/${series._id}`}
            className="font-semibold text-ink-900 hover:underline"
          >
            {series.title || "未命名的系列"}
          </Link>
          <p className="text-ink-500 text-xs">{count} 篇</p>
          {series.description && !editing && (
            <p className="mt-1 line-clamp-2 text-ink-700 text-sm leading-6">
              {series.description}
            </p>
          )}
        </div>
        {manage && !editing && (
          <div className="flex shrink-0 gap-0.5">
            <button
              type="button"
              className={icon}
              onClick={onEdit}
              aria-label={`編輯系列：${series.title}`}
            >
              <Pencil aria-hidden className="size-4" />
            </button>
            <button
              type="button"
              className={`${icon} hover:text-danger-700`}
              onClick={onDelete}
              aria-label={`刪除系列：${series.title}`}
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          </div>
        )}
      </div>
      {children}
    </li>
  );
}

export default function SeriesTab({
  userId,
  isOwn,
  mobile = false,
}: {
  userId: string;
  isOwn: boolean;
  mobile?: boolean;
}) {
  const client = useQueryClient();
  const list = useUserSeries(userId);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const ownPosts = useOwnPosts(userId, isOwn);
  const series = list.data ?? [];

  async function refresh(id?: string) {
    await Promise.all([
      client.invalidateQueries({ queryKey: seriesKeys.ofUser(userId) }),
      id
        ? client.invalidateQueries({ queryKey: seriesKeys.detail(id) })
        : Promise.resolve(),
    ]);
  }

  async function remove(item: TSeries) {
    const answer = await Swal.fire({
      title: `刪除「${item.title}」？`,
      text: "只會刪除這個系列，裡面的貼文不會被刪除。",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
      confirmButtonColor: "#b42318",
    });
    if (!answer.isConfirmed) {
      return;
    }
    const result = await deleteSeries(item._id);
    if (!result.ok) {
      notice("error", `刪除失敗：${seriesError(result)}`);
      return;
    }
    notice("success", "已刪除系列");
    await refresh(item._id);
  }

  return (
    <div className="flex flex-col gap-3" data-series-tab>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold text-base text-ink-900">系列</h2>
        {isOwn && !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-control bg-brand-700 px-3.5 font-semibold text-sm text-white hover:bg-brand-800 ${
              mobile ? "h-11" : "h-9"
            }`}
          >
            <Plus aria-hidden className="size-4" />
            新增系列
          </button>
        )}
      </div>
      {isOwn && (
        <p className="text-ink-500 text-xs leading-5">
          把相關的貼文排成系列，讀者在貼文頁可以看到上一篇、下一篇。發文時也可以直接選擇要加入的系列。
        </p>
      )}
      {creating && (
        <CreateForm
          mobile={mobile}
          onCancel={() => setCreating(false)}
          onDone={async () => {
            setCreating(false);
            await refresh();
          }}
        />
      )}
      {list.isPending ? (
        <div className="h-24 animate-pulse rounded-card border border-line bg-surface shadow-card" />
      ) : list.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-6 text-ink-700 text-sm shadow-card"
        >
          <p>系列載入失敗：{getErrorMessage(list.error)}</p>
          <button
            type="button"
            className="h-9 cursor-pointer rounded-control border border-line-strong px-4 font-semibold hover:bg-field"
            onClick={() => list.refetch()}
          >
            重試
          </button>
        </div>
      ) : series.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-6 text-center text-ink-500 text-sm shadow-card">
          {isOwn ? "還沒有系列。按「新增系列」建立第一個。" : "還沒有系列"}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {series.map((item) => (
            <SeriesCard
              key={item._id}
              series={item}
              manage={isOwn}
              editing={editing === item._id}
              onEdit={() => setEditing(item._id)}
              onDelete={() => remove(item)}
              mobile={mobile}
            >
              {editing === item._id && (
                <SeriesEditor
                  series={item}
                  ownPosts={ownPosts.data ?? []}
                  ownPostsError={
                    ownPosts.isError ? getErrorMessage(ownPosts.error) : null
                  }
                  mobile={mobile}
                  onCancel={() => setEditing(null)}
                  onDone={async () => {
                    setEditing(null);
                    await refresh(item._id);
                  }}
                />
              )}
            </SeriesCard>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  FolderInput,
  MessageSquare,
  Pin,
  PinOff,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { ANNOUNCEMENT_SIG_ID } from "@/utils/useAdminAccess";
import {
  adminKeys,
  errorText,
  failureMessage,
  PAGE_SIZE,
  send,
  useInvalidate,
  usePosts,
  useSigNames,
} from "../(admin)/api";
import { PageHeader } from "../(admin)/components/AdminShell";
import {
  type Column,
  DataTable,
  Truncate,
} from "../(admin)/components/DataTable";
import { Drawer } from "../(admin)/components/Drawer";
import {
  FilterBar,
  SearchBox,
  SelectFilter,
} from "../(admin)/components/Filters";
import { ListCard } from "../(admin)/components/ListCard";
import { useConfirm } from "../(admin)/components/Modal";
import { Pagination, pageCount } from "../(admin)/components/Pagination";
import {
  Badge,
  Button,
  buttonClass,
  InfoRow,
  linkClass,
} from "../(admin)/components/ui";
import { canManageSig, useAdmin } from "../(admin)/context";
import { formatCount, formatDate, formatDateTime } from "../(admin)/format";
import {
  MovePostsDialog,
  type MoveSelection,
} from "../(admin)/posts/MovePostsDialog";
import type {
  AdminPost,
  ListPage,
  PostBatchAction,
  PostSort,
  PostStatus,
} from "../(admin)/types";
import { oneOf, useQueryState } from "../(admin)/useQueryState";

// 貼文: search by title or author, filter by SIG and status, sort, pin,
// take down and restore, one post at a time (drawer) or in batches.

const STATUSES: readonly PostStatus[] = ["active", "pinned", "removed", "all"];
const SORTS: readonly PostSort[] = ["newest", "oldest", "likes"];

const STATUS_OPTIONS = [
  { value: "active", label: "公開中" },
  { value: "pinned", label: "置頂" },
  { value: "removed", label: "已下架" },
  { value: "all", label: "全部" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "最新" },
  { value: "oldest", label: "最舊" },
  { value: "likes", label: "最多讚" },
];

const BATCH_DONE: Record<PostBatchAction, string> = {
  pin: "置頂",
  unpin: "取消置頂",
  remove: "下架",
  restore: "復原",
};

type PostState = { _id: string; pinned?: boolean; removed?: boolean };

export default function AdminPostsPage() {
  const admin = useAdmin();
  const { get, set, page } = useQueryState();
  const q = get("q");
  const sig = get("sig");
  const status = oneOf(get("status"), STATUSES, "active");
  const sort = oneOf(get("sort"), SORTS, "newest");

  const query = {
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    q: q || undefined,
    sig: sig || undefined,
    status,
    sort,
  };
  const posts = usePosts(query);
  const { names, sigs } = useSigNames();
  const queryClient = useQueryClient();
  const invalidate = useInvalidate();
  const confirm = useConfirm();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<AdminPost | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [moving, setMoving] = useState<MoveSelection | null>(null);

  const items = posts.data?.items ?? [];
  const total = posts.data?.total ?? 0;
  const pages = pageCount(total, PAGE_SIZE);

  // A new filter or page starts with nothing selected.
  const filterKey = `${q}|${sig}|${status}|${sort}|${page}`;
  useEffect(() => {
    setSelected(new Set());
  }, [filterKey]);

  // Posts removed meanwhile can leave the page past the end.
  useEffect(() => {
    if (posts.isSuccess && !posts.isPlaceholderData && page > pages) {
      set({ page: pages > 1 ? pages : null }, { replace: true });
    }
  }, [posts.isSuccess, posts.isPlaceholderData, page, pages]);

  // Keep the drawer in step with the list after a refetch.
  const current = useMemo(() => {
    if (!open) {
      return null;
    }
    return items.find((post) => post._id === open._id) ?? open;
  }, [open, items]);

  const sigOptions = useMemo(
    () => [
      { value: "", label: "全部 SIG" },
      { value: ANNOUNCEMENT_SIG_ID, label: "公告" },
      ...sigs.map((s) => ({ value: s._id, label: s.name })),
    ],
    [sigs],
  );

  /** Pinning is safe to show before the server answers; undo on failure. */
  const patchCached = (state: PostState) => {
    queryClient.setQueriesData<ListPage<AdminPost>>(
      { queryKey: adminKeys.posts },
      (old) =>
        old && {
          ...old,
          items: old.items.map((post) =>
            post._id === state._id ? { ...post, ...state } : post,
          ),
        },
    );
    setOpen((prev) =>
      prev && prev._id === state._id ? { ...prev, ...state } : prev,
    );
  };

  const togglePin = async (post: AdminPost) => {
    const pinned = !post.pinned;
    setBusy(post._id);
    patchCached({ _id: post._id, pinned });
    const result = await send<PostState>(`/admin/posts/${post._id}/pin`, {
      body: { pinned },
    });
    setBusy(null);
    if (!result.ok) {
      patchCached({ _id: post._id, pinned: post.pinned });
      toast.error(failureMessage(result));
      return;
    }
    toast.success(pinned ? "已置頂" : "已取消置頂");
    await invalidate(adminKeys.posts, adminKeys.overview);
  };

  const setRemoved = async (post: AdminPost, removed: boolean) => {
    if (removed) {
      const ok = await confirm({
        title: "下架這篇貼文？",
        description: `「${post.title}」會從網站上消失，之後可以在「已下架」中復原。`,
        confirmLabel: "下架",
        tone: "danger",
      });
      if (!ok) {
        return;
      }
    }
    setBusy(post._id);
    const result = await send<PostState>(
      `/admin/posts/${post._id}/${removed ? "remove" : "restore"}`,
    );
    setBusy(null);
    if (!result.ok) {
      toast.error(failureMessage(result));
      return;
    }
    patchCached({ ...result.data, _id: post._id, removed });
    toast.success(removed ? "已下架" : "已復原");
    await invalidate(adminKeys.posts, adminKeys.overview);
  };

  const runBatch = async (action: PostBatchAction) => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      return;
    }
    if (action === "remove") {
      const ok = await confirm({
        title: `下架 ${ids.length} 篇貼文？`,
        description: "這些貼文會從網站上消失，之後可以在「已下架」中復原。",
        confirmLabel: "全部下架",
        tone: "danger",
      });
      if (!ok) {
        return;
      }
    }
    setBusy("batch");
    const result = await send<{ updated?: number }>("/admin/posts/batch", {
      body: { ids, action },
    });
    setBusy(null);
    if (!result.ok) {
      toast.error(failureMessage(result));
      return;
    }
    // `updated` counts only posts that changed; the rest already were.
    const updated =
      typeof result.data?.updated === "number"
        ? result.data.updated
        : ids.length;
    const unchanged = ids.length - updated;
    toast.success(
      unchanged > 0
        ? `已${BATCH_DONE[action]} ${updated} 篇，另 ${unchanged} 篇原本就是這個狀態`
        : `已${BATCH_DONE[action]} ${updated} 篇`,
    );
    setSelected(new Set());
    await invalidate(adminKeys.posts, adminKeys.overview);
  };

  const sortBy = (next: PostSort) => {
    set({ sort: next === "newest" ? null : next });
  };

  const columns: Column<AdminPost>[] = [
    {
      key: "title",
      header: "標題",
      primary: true,
      cell: (post) => (
        <span className="flex min-w-0 items-center gap-1.5">
          {post.pinned && <Badge tone="warn">置頂</Badge>}
          {post.removed && <Badge tone="danger">已下架</Badge>}
          <Truncate className="font-medium text-ink-900">
            {post.title || "（無標題）"}
          </Truncate>
        </span>
      ),
    },
    {
      key: "sig",
      header: "SIG",
      className: "w-[18%]",
      cell: (post) => <Truncate>{names.get(post.sig) ?? "—"}</Truncate>,
    },
    {
      key: "author",
      header: "作者",
      className: "w-[16%]",
      cell: (post) => (
        <Truncate>{post.user?.name ?? "已刪除的使用者"}</Truncate>
      ),
    },
    {
      key: "date",
      header: "日期",
      className: "w-[7.5rem]",
      sort: {
        direction:
          sort === "newest" ? "desc" : sort === "oldest" ? "asc" : null,
        onSort: () => sortBy(sort === "newest" ? "oldest" : "newest"),
      },
      cell: (post) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDate(post.createdAt)}
        </span>
      ),
    },
    {
      key: "likes",
      header: "讚",
      className: "w-[4.5rem] text-right",
      sort: {
        direction: sort === "likes" ? "desc" : null,
        onSort: () => sortBy(sort === "likes" ? "newest" : "likes"),
      },
      cell: (post) => (
        <span className="tabular-nums">{formatCount(post.likes ?? 0)}</span>
      ),
    },
    {
      key: "comments",
      optional: true,
      header: "留言",
      className: "w-[4.5rem] text-right",
      cell: (post) => (
        <span className="tabular-nums">{formatCount(post.comments ?? 0)}</span>
      ),
    },
  ];

  const description = posts.data
    ? `共 ${formatCount(total)} 篇${q ? `符合「${q}」` : ""}`
    : "載入中…";

  return (
    <>
      <PageHeader title="貼文" description={description} />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <ListCard
            toolbar={
              <FilterBar>
                <SearchBox
                  value={q}
                  onCommit={(next) => set({ q: next }, { replace: true })}
                  label="搜尋貼文"
                  placeholder="搜尋標題或作者…"
                  className="sm:flex-1"
                />
                <SelectFilter
                  label="SIG"
                  value={sig}
                  options={sigOptions}
                  onChange={(next) => set({ sig: next })}
                  className="sm:w-44"
                />
                <SelectFilter
                  label="狀態"
                  value={status}
                  options={STATUS_OPTIONS}
                  onChange={(next) =>
                    set({ status: next === "active" ? null : next })
                  }
                  className="sm:w-32"
                />
                <SelectFilter
                  label="排序"
                  value={sort}
                  options={SORT_OPTIONS}
                  onChange={(next) => sortBy(next as PostSort)}
                  className="sm:w-32"
                />
              </FilterBar>
            }
            footer={
              <>
                {selected.size > 0 ? (
                  <div
                    role="toolbar"
                    aria-label="批次操作"
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    <span className="mr-1 font-semibold text-ink-800 text-sm">
                      已選 {selected.size} 篇
                    </span>
                    <Button
                      size="sm"
                      onClick={() => runBatch("pin")}
                      disabled={busy === "batch"}
                    >
                      置頂
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => runBatch("unpin")}
                      disabled={busy === "batch"}
                    >
                      取消置頂
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-outline"
                      onClick={() => runBatch("remove")}
                      disabled={busy === "batch"}
                    >
                      下架
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => runBatch("restore")}
                      disabled={busy === "batch"}
                    >
                      復原
                    </Button>
                    {/* Moving posts is admin-only (contract v4 §5.7). */}
                    {admin.isAdmin && (
                      <Button
                        size="sm"
                        onClick={() => setMoving({ ids: Array.from(selected) })}
                        disabled={busy === "batch"}
                      >
                        <FolderInput aria-hidden className="size-3.5" />
                        搬移到其他 SIG
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelected(new Set())}
                    >
                      清除選取
                    </Button>
                  </div>
                ) : (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="hidden text-ink-500 text-xs sm:inline">
                      {admin.isAdmin
                        ? "勾選貼文可以一次置頂、下架、復原或搬移"
                        : "勾選貼文可以一次置頂、下架或復原"}
                    </span>
                    {admin.isAdmin && sig && total > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setMoving({
                            fromSig: sig,
                            fromName: names.get(sig) ?? "這個 SIG",
                          })
                        }
                      >
                        <FolderInput aria-hidden className="size-3.5" />
                        搬移 {names.get(sig) ?? "這個 SIG"} 的全部貼文
                      </Button>
                    )}
                  </span>
                )}
                <div className="sm:ml-auto">
                  <Pagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={total}
                    unit="篇"
                    onPage={(next) => set({ page: next > 1 ? next : null })}
                    disabled={posts.isFetching}
                  />
                </div>
              </>
            }
          >
            <DataTable
              caption="貼文列表"
              rows={items}
              rowKey={(post) => post._id}
              rowLabel={(post) => post.title || "（無標題）"}
              columns={columns}
              card={(post) => (
                <span className="flex flex-col gap-0.5">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {post.pinned && <Badge tone="warn">置頂</Badge>}
                    {post.removed && <Badge tone="danger">已下架</Badge>}
                    <span className="truncate font-semibold text-ink-900 text-sm">
                      {post.title || "（無標題）"}
                    </span>
                  </span>
                  <span className="truncate text-ink-500 text-xs">
                    {names.get(post.sig) ?? "—"} ·{" "}
                    {post.user?.name ?? "已刪除的使用者"} ·{" "}
                    {formatDate(post.createdAt)} · {post.likes ?? 0} 讚 ·{" "}
                    {post.comments ?? 0} 留言
                  </span>
                </span>
              )}
              onOpen={(post) => setOpen(post)}
              activeKey={current?._id}
              compact={Boolean(current)}
              selection={{ selected, onChange: setSelected }}
              loading={posts.isPending}
              fetching={posts.isFetching && !posts.isPending}
              error={posts.isError ? errorText(posts.error) : null}
              onRetry={() => posts.refetch()}
              empty={
                q || sig || status !== "active"
                  ? "沒有符合條件的貼文"
                  : "還沒有貼文"
              }
            />
          </ListCard>
        </div>

        <MovePostsDialog
          selection={moving}
          onClose={() => setMoving(null)}
          onMoved={() => setSelected(new Set())}
        />
        <Drawer
          open={Boolean(current)}
          onClose={() => setOpen(null)}
          title={current?.title || "（無標題）"}
          subtitle={
            current && (
              <>
                {names.get(current.sig) ?? "未知 SIG"} ·{" "}
                {current.user?.name ?? "已刪除的使用者"} ·{" "}
                {formatDate(current.createdAt)}
              </>
            )
          }
          footer={
            current && (
              <>
                <Link
                  href={`/post/${current._id}`}
                  target="_blank"
                  className={buttonClass("primary", "sm")}
                >
                  <ExternalLink aria-hidden className="size-3.5" />
                  在網站上開啟
                </Link>
                {!current.removed && (
                  <Button
                    size="sm"
                    onClick={() => togglePin(current)}
                    disabled={busy === current._id}
                  >
                    {current.pinned ? (
                      <PinOff aria-hidden className="size-3.5" />
                    ) : (
                      <Pin aria-hidden className="size-3.5" />
                    )}
                    {current.pinned ? "取消置頂" : "置頂"}
                  </Button>
                )}
                {current.removed ? (
                  <Button
                    size="sm"
                    onClick={() => setRemoved(current, false)}
                    loading={busy === current._id}
                  >
                    <RotateCcw aria-hidden className="size-3.5" />
                    復原
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger-outline"
                    onClick={() => setRemoved(current, true)}
                    loading={busy === current._id}
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                    下架
                  </Button>
                )}
              </>
            )
          }
        >
          {current && (
            <>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {current.removed ? (
                  <Badge tone="danger">已下架</Badge>
                ) : (
                  <Badge tone="ok">公開中</Badge>
                )}
                {current.pinned && <Badge tone="warn">置頂</Badge>}
              </div>
              <dl>
                <InfoRow label="讚">{formatCount(current.likes ?? 0)}</InfoRow>
                <InfoRow label="留言">
                  {formatCount(current.comments ?? 0)}
                  {(current.comments ?? 0) > 0 && (
                    <Link
                      href={`/admin/comments?post=${current._id}&postTitle=${encodeURIComponent(current.title)}`}
                      className={`${linkClass} ml-2 inline-flex items-center gap-1 text-xs`}
                    >
                      <MessageSquare aria-hidden className="size-3" />
                      查看留言
                    </Link>
                  )}
                </InfoRow>
                <InfoRow label="SIG">
                  {canManageSig(admin, current.sig) ? (
                    <Link
                      href={`/admin/sigs/${current.sig}`}
                      className={linkClass}
                    >
                      {names.get(current.sig) ?? current.sig}
                    </Link>
                  ) : (
                    (names.get(current.sig) ?? current.sig)
                  )}
                </InfoRow>
                <InfoRow label="作者">
                  {current.user ? (
                    <Link
                      href={`/admin/users?q=${encodeURIComponent(current.user.customId ?? current.user.name ?? "")}`}
                      className={linkClass}
                    >
                      {current.user.name}
                      {current.user.customId && ` @${current.user.customId}`}
                    </Link>
                  ) : (
                    "已刪除的使用者"
                  )}
                </InfoRow>
                <InfoRow label="發布">
                  {formatDateTime(current.createdAt)}
                </InfoRow>
                <InfoRow label="最後更新">
                  {formatDateTime(current.updatedAt)}
                </InfoRow>
              </dl>
            </>
          )}
        </Drawer>
      </div>
    </>
  );
}

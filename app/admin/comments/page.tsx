"use client";

import { ExternalLink, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import {
  adminKeys,
  errorText,
  failureMessage,
  PAGE_SIZE,
  send,
  useComments,
  useInvalidate,
  usePatchList,
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
  FilterChip,
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
import { formatCount, formatDateTime, formatRelative } from "../(admin)/format";
import type { AdminComment, CommentStatus } from "../(admin)/types";
import { oneOf, useQueryState } from "../(admin)/useQueryState";

// 留言: newest comments first, search the content, filter by post, author
// or status, and take down (or restore) a comment.

const STATUSES: readonly CommentStatus[] = ["active", "removed", "all"];
const STATUS_OPTIONS = [
  { value: "active", label: "顯示中" },
  { value: "removed", label: "已刪除" },
  { value: "all", label: "全部" },
];

export default function AdminCommentsPage() {
  const { get, set, page } = useQueryState();
  const q = get("q");
  const post = get("post");
  const user = get("user");
  const status = oneOf(get("status"), STATUSES, "active");

  const comments = useComments({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    q: q || undefined,
    post: post || undefined,
    user: user || undefined,
    status,
  });
  const invalidate = useInvalidate();
  const patch = usePatchList<AdminComment>(adminKeys.comments);
  const confirm = useConfirm();
  const [open, setOpen] = useState<AdminComment | null>(null);
  const [busy, setBusy] = useState(false);

  const items = comments.data?.items ?? [];
  const total = comments.data?.total ?? 0;
  const pages = pageCount(total, PAGE_SIZE);

  useEffect(() => {
    if (comments.isSuccess && !comments.isPlaceholderData && page > pages) {
      set({ page: pages > 1 ? pages : null }, { replace: true });
    }
  }, [comments.isSuccess, comments.isPlaceholderData, page, pages]);

  const current = useMemo(
    () => (open ? (items.find((c) => c._id === open._id) ?? open) : null),
    [open, items],
  );

  // Labels for filters set from another page (?postTitle=, ?userName=).
  const postLabel = get("postTitle") || "這篇貼文";
  const userLabel = get("userName") || "這位使用者";

  const setRemoved = async (comment: AdminComment, removed: boolean) => {
    if (removed) {
      const ok = await confirm({
        title: "刪除這則留言？",
        description: "留言會從貼文下方消失，之後可以在「已刪除」中復原。",
        confirmLabel: "刪除",
        tone: "danger",
      });
      if (!ok) {
        return;
      }
    }
    setBusy(true);
    const result = await send<{ removed?: boolean }>(
      `/admin/comments/${comment._id}/${removed ? "remove" : "restore"}`,
    );
    setBusy(false);
    if (!result.ok) {
      toast.error(failureMessage(result));
      return;
    }
    const state =
      typeof result.data?.removed === "boolean" ? result.data.removed : removed;
    patch(comment._id, { removed: state });
    setOpen({ ...comment, removed: state });
    toast.success(removed ? "已刪除留言" : "已復原留言");
    await invalidate(adminKeys.comments, adminKeys.overview);
  };

  const columns: Column<AdminComment>[] = [
    {
      key: "content",
      header: "留言",
      primary: true,
      cell: (comment) => (
        <span className="flex min-w-0 items-center gap-1.5">
          {comment.removed && <Badge tone="danger">已刪除</Badge>}
          {comment.reply && <Badge tone="mute">回覆</Badge>}
          <Truncate className="text-ink-900">{comment.content}</Truncate>
        </span>
      ),
    },
    {
      key: "post",
      header: "貼文",
      className: "w-[24%]",
      cell: (comment) => (
        <Truncate>{comment.post?.title ?? "已刪除的貼文"}</Truncate>
      ),
    },
    {
      key: "author",
      optional: true,
      header: "作者",
      className: "w-[15%]",
      cell: (comment) => (
        <Truncate>{comment.user?.name ?? "已刪除的使用者"}</Truncate>
      ),
    },
    {
      key: "date",
      header: "時間",
      className: "w-[7rem]",
      cell: (comment) => (
        <span
          className="whitespace-nowrap"
          title={formatDateTime(comment.createdAt)}
        >
          {formatRelative(comment.createdAt)}
        </span>
      ),
    },
  ];

  const filtered = Boolean(q || post || user || status !== "active");

  return (
    <>
      <PageHeader
        title="留言"
        description={comments.data ? `共 ${formatCount(total)} 則` : "載入中…"}
      />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <ListCard
            toolbar={
              <div className="flex flex-col gap-2">
                <FilterBar>
                  <SearchBox
                    value={q}
                    onCommit={(next) => set({ q: next }, { replace: true })}
                    label="搜尋留言內容"
                    placeholder="搜尋留言內容…"
                    className="sm:flex-1"
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
                </FilterBar>
                {(post || user) && (
                  <div className="flex flex-wrap gap-2">
                    {post && (
                      <FilterChip
                        label={`貼文：${postLabel}`}
                        onClear={() => set({ post: null, postTitle: null })}
                      />
                    )}
                    {user && (
                      <FilterChip
                        label={`作者：${userLabel}`}
                        onClear={() => set({ user: null, userName: null })}
                      />
                    )}
                  </div>
                )}
              </div>
            }
            footer={
              <div className="sm:ml-auto">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  unit="則"
                  onPage={(next) => set({ page: next > 1 ? next : null })}
                  disabled={comments.isFetching}
                />
              </div>
            }
          >
            <DataTable
              caption="留言列表"
              rows={items}
              rowKey={(comment) => comment._id}
              rowLabel={(comment) => comment.content.slice(0, 40)}
              columns={columns}
              card={(comment) => (
                <span className="flex flex-col gap-1">
                  <span className="line-clamp-2 text-ink-900 text-sm">
                    {comment.removed && (
                      <Badge tone="danger" className="mr-1.5">
                        已刪除
                      </Badge>
                    )}
                    {comment.content}
                  </span>
                  <span className="truncate text-ink-500 text-xs">
                    {comment.user?.name ?? "已刪除的使用者"} ·{" "}
                    {comment.post?.title ?? "已刪除的貼文"} ·{" "}
                    {formatRelative(comment.createdAt)}
                  </span>
                </span>
              )}
              onOpen={(comment) => setOpen(comment)}
              activeKey={current?._id}
              compact={Boolean(current)}
              loading={comments.isPending}
              fetching={comments.isFetching && !comments.isPending}
              error={comments.isError ? errorText(comments.error) : null}
              onRetry={() => comments.refetch()}
              empty={filtered ? "沒有符合條件的留言" : "還沒有留言"}
            />
          </ListCard>
        </div>

        <Drawer
          open={Boolean(current)}
          onClose={() => setOpen(null)}
          title={current?.user?.name ? `${current.user.name} 的留言` : "留言"}
          subtitle={current && formatDateTime(current.createdAt)}
          footer={
            current && (
              <>
                {current.post && (
                  <Link
                    href={`/post/${current.post._id}`}
                    target="_blank"
                    className={buttonClass("primary", "sm")}
                  >
                    <ExternalLink aria-hidden className="size-3.5" />
                    開啟貼文
                  </Link>
                )}
                {current.removed ? (
                  <Button
                    size="sm"
                    onClick={() => setRemoved(current, false)}
                    loading={busy}
                  >
                    <RotateCcw aria-hidden className="size-3.5" />
                    復原
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger-outline"
                    onClick={() => setRemoved(current, true)}
                    loading={busy}
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                    刪除
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
                  <Badge tone="danger">已刪除</Badge>
                ) : (
                  <Badge tone="ok">顯示中</Badge>
                )}
                {current.reply && <Badge tone="mute">回覆其他留言</Badge>}
              </div>
              <p className="whitespace-pre-wrap break-words rounded-control bg-field px-3 py-2 text-ink-800 text-sm leading-relaxed">
                {current.content}
              </p>
              <dl className="mt-3">
                <InfoRow label="貼文">
                  {current.post ? (
                    <Link
                      href={`/admin/comments?post=${current.post._id}&postTitle=${encodeURIComponent(current.post.title ?? "")}`}
                      className={linkClass}
                    >
                      {current.post.title || "（無標題）"}
                    </Link>
                  ) : (
                    "已刪除的貼文"
                  )}
                </InfoRow>
                <InfoRow label="作者">
                  {current.user ? (
                    <Link
                      href={`/admin/comments?user=${current.user._id}&userName=${encodeURIComponent(current.user.name ?? "")}`}
                      className={linkClass}
                    >
                      {current.user.name}
                      {current.user.customId && ` @${current.user.customId}`}
                    </Link>
                  ) : (
                    "已刪除的使用者"
                  )}
                </InfoRow>
                <InfoRow label="留言時間">
                  {formatDateTime(current.createdAt)}
                </InfoRow>
                {current.updatedAt &&
                  current.createdAt &&
                  new Date(current.updatedAt).getTime() -
                    new Date(current.createdAt).getTime() >
                    5000 && (
                    <InfoRow label="最後編輯">
                      {formatDateTime(current.updatedAt)}
                    </InfoRow>
                  )}
              </dl>
              <p className="mt-2 text-ink-500 text-xs">
                點貼文或作者，只看該貼文或該作者的留言。
              </p>
            </>
          )}
        </Drawer>
      </div>
    </>
  );
}

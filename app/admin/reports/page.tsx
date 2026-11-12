"use client";

import { Ban, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { CustomStatus } from "@/modules/customStatusCode";
import {
  adminKeys,
  errorText,
  failureMessage,
  isObjectId,
  PAGE_SIZE,
  resolveReport,
  useInvalidate,
  usePatchList,
  useReports,
} from "../(admin)/api";
import { PageHeader } from "../(admin)/components/AdminShell";
import {
  type Column,
  DataTable,
  Truncate,
} from "../(admin)/components/DataTable";
import { Drawer } from "../(admin)/components/Drawer";
import { FilterBar, SelectFilter } from "../(admin)/components/Filters";
import { ListCard } from "../(admin)/components/ListCard";
import { Modal } from "../(admin)/components/Modal";
import { Pagination, pageCount } from "../(admin)/components/Pagination";
import {
  Badge,
  type BadgeTone,
  Button,
  buttonClass,
  Field,
  InfoRow,
  textareaClass,
} from "../(admin)/components/ui";
import { useAdmin } from "../(admin)/context";
import { formatCount, formatDateTime, formatRelative } from "../(admin)/format";
import type {
  AdminReport,
  ReportAction,
  ReportKind,
  ReportStatus,
  ReportStatusFilter,
  ReportTarget,
} from "../(admin)/types";
import { oneOf, useQueryState } from "../(admin)/useQueryState";

// 檢舉: reports on posts and comments. Open reports come oldest first (the
// backend sorts); an admin removes the content or dismisses the report,
// which closes every open report on the same content and tells the
// reporter.

const STATUSES: readonly ReportStatusFilter[] = [
  "open",
  "resolved",
  "dismissed",
  "all",
];
const STATUS_OPTIONS = [
  { value: "open", label: "待處理" },
  { value: "resolved", label: "已移除內容" },
  { value: "dismissed", label: "不處理" },
  { value: "all", label: "全部" },
];

const KINDS: readonly (ReportKind | "all")[] = ["all", "post", "comment"];
const KIND_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "post", label: "貼文" },
  { value: "comment", label: "留言" },
];

const REASON_LABEL = new Map<string, string>([
  ["spam", "垃圾訊息或廣告"],
  ["harassment", "騷擾或霸凌"],
  ["inappropriate", "不當內容"],
  ["privacy", "侵犯隱私"],
  ["other", "其他"],
]);

const STATUS_BADGE = new Map<string, { label: string; tone: BadgeTone }>([
  ["open", { label: "待處理", tone: "warn" }],
  ["resolved", { label: "已移除內容", tone: "danger" }],
  ["dismissed", { label: "不處理", tone: "mute" }],
]);

/** The backend refuses a longer 處理說明. */
const RESOLUTION_MAX = 300;

function reasonLabel(reason: string | undefined) {
  if (!reason) {
    return "—";
  }
  return REASON_LABEL.get(reason) ?? reason;
}

function kindLabel(kind: string) {
  return kind === "comment" ? "留言" : "貼文";
}

function StatusBadge({ status }: { status: string | undefined }) {
  const badge = STATUS_BADGE.get(status ?? "");
  return (
    <Badge tone={badge?.tone ?? "mute"}>
      {badge?.label ?? (status || "—")}
    </Badge>
  );
}

function KindBadge({ kind }: { kind: string }) {
  return (
    <Badge tone={kind === "comment" ? "mute" : "info"}>{kindLabel(kind)}</Badge>
  );
}

/** A post's title or a comment's excerpt. */
function targetText(target: ReportTarget) {
  const text =
    target.kind === "comment"
      ? target.excerpt || target.title
      : target.title || target.excerpt;
  return text?.trim() || "內容已不存在";
}

/** The post to open: the post itself, or the one a comment sits under. */
function postIdOf(target: ReportTarget) {
  if (target.kind === "post") {
    return isObjectId(target.id) ? target.id : null;
  }
  const post = target.post;
  const candidates = [
    typeof post === "string" ? post : post?._id,
    target.postId,
  ];
  for (const id of candidates) {
    if (id && isObjectId(id)) {
      return id;
    }
  }
  return null;
}

function reporterName(report: AdminReport) {
  return report.reporter?.name || "已刪除的使用者";
}

function handlerName(report: AdminReport, selfId: string) {
  const value = report.handledByUser ?? report.handledBy;
  if (!value) {
    return "—";
  }
  const id = typeof value === "string" ? value : value._id;
  if (id && id === selfId) {
    return "你";
  }
  if (typeof value === "string") {
    return "管理員";
  }
  return value.name || "管理員";
}

type ResolveRequest = { report: AdminReport; action: ReportAction };

export default function AdminReportsPage() {
  const admin = useAdmin();
  const { get, set, page } = useQueryState();
  const status = oneOf(get("status"), STATUSES, "open");
  const kind = oneOf(get("kind"), KINDS, "all");

  const reports = useReports({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    status,
    kind: kind === "all" ? undefined : kind,
  });
  const invalidate = useInvalidate();
  const patch = usePatchList<AdminReport>(adminKeys.reports);
  const [open, setOpen] = useState<AdminReport | null>(null);
  const [request, setRequest] = useState<ResolveRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const items = reports.data?.items ?? [];
  const total = reports.data?.total ?? 0;
  const pages = pageCount(total, PAGE_SIZE);

  useEffect(() => {
    if (reports.isSuccess && !reports.isPlaceholderData && page > pages) {
      set({ page: pages > 1 ? pages : null }, { replace: true });
    }
  }, [reports.isSuccess, reports.isPlaceholderData, page, pages]);

  const current = useMemo(
    () => (open ? (items.find((r) => r._id === open._id) ?? open) : null),
    [open, items],
  );

  // The badge, the overview, and the post and comment lists change too
  // (the open count sits under adminKeys.reports).
  const refresh = () =>
    invalidate(
      adminKeys.reports,
      adminKeys.overview,
      adminKeys.posts,
      adminKeys.comments,
    );

  const resolve = async (resolution: string) => {
    if (!request) {
      return;
    }
    const { report, action } = request;
    setBusy(true);
    const result = await resolveReport(report._id, action, resolution);
    setBusy(false);
    if (!result.ok) {
      // Gone (4000), or already closed by someone else (4031).
      if (
        result.status === CustomStatus.NOT_FOUND ||
        result.status === CustomStatus.ALREADY_CONFIRMED
      ) {
        toast.error("這筆檢舉已經處理過或不存在，已重新整理");
        setRequest(null);
        setOpen(null);
        await refresh();
        return;
      }
      toast.error(failureMessage(result));
      return;
    }
    // The backend may answer with the updated report, or with nothing.
    const data: Partial<AdminReport> =
      result.data && typeof result.data === "object" ? result.data : {};
    const fallback: ReportStatus =
      action === "remove" ? "resolved" : "dismissed";
    const update: Partial<AdminReport> = {
      status: STATUS_BADGE.has(data.status ?? "")
        ? (data.status as ReportStatus)
        : fallback,
      resolution:
        typeof data.resolution === "string" ? data.resolution : resolution,
      handledBy: data.handledBy ?? admin.userId,
      updatedAt:
        typeof data.updatedAt === "string"
          ? data.updatedAt
          : new Date().toISOString(),
      target:
        action === "remove"
          ? { ...report.target, removed: true }
          : report.target,
    };
    patch(report._id, update);
    setOpen({ ...report, ...update });
    setRequest(null);
    toast.success(action === "remove" ? "已移除內容並結案" : "已標記為不處理");
    await refresh();
  };

  const columns: Column<AdminReport>[] = [
    {
      key: "target",
      header: "內容",
      primary: true,
      cell: (report) => (
        <span className="flex min-w-0 items-center gap-1.5">
          <KindBadge kind={report.target.kind} />
          {report.target.removed && <Badge tone="danger">已移除</Badge>}
          <Truncate className="text-ink-900">
            {targetText(report.target)}
          </Truncate>
        </span>
      ),
    },
    {
      key: "reason",
      header: "原因",
      className: "w-[9.5rem]",
      cell: (report) => <Truncate>{reasonLabel(report.reason)}</Truncate>,
    },
    {
      key: "reporter",
      optional: true,
      header: "檢舉人",
      className: "w-[14%]",
      cell: (report) => <Truncate>{reporterName(report)}</Truncate>,
    },
    {
      key: "status",
      header: "狀態",
      className: "w-[6.5rem]",
      cell: (report) => <StatusBadge status={report.status} />,
    },
    {
      key: "date",
      header: "時間",
      className: "w-[7rem]",
      cell: (report) => (
        <span
          className="whitespace-nowrap"
          title={formatDateTime(report.createdAt)}
        >
          {formatRelative(report.createdAt)}
        </span>
      ),
    },
  ];

  const postId = current ? postIdOf(current.target) : null;
  const handled = Boolean(current && current.status !== "open");

  return (
    <>
      <PageHeader
        title="檢舉"
        description={reports.data ? `共 ${formatCount(total)} 筆` : "載入中…"}
      />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <ListCard
            toolbar={
              <FilterBar>
                <SelectFilter
                  label="狀態"
                  value={status}
                  options={STATUS_OPTIONS}
                  onChange={(next) =>
                    set({ status: next === "open" ? null : next })
                  }
                  className="sm:w-36"
                />
                <SelectFilter
                  label="類型"
                  value={kind}
                  options={KIND_OPTIONS}
                  onChange={(next) =>
                    set({ kind: next === "all" ? null : next })
                  }
                  className="sm:w-32"
                />
              </FilterBar>
            }
            footer={
              <div className="sm:ml-auto">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  unit="筆"
                  onPage={(next) => set({ page: next > 1 ? next : null })}
                  disabled={reports.isFetching}
                />
              </div>
            }
          >
            <DataTable
              caption="檢舉列表"
              rows={items}
              rowKey={(report) => report._id}
              rowLabel={(report) =>
                `${kindLabel(report.target.kind)}：${targetText(
                  report.target,
                ).slice(0, 40)}`
              }
              columns={columns}
              card={(report) => (
                <span className="flex flex-col gap-1">
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <StatusBadge status={report.status} />
                    <KindBadge kind={report.target.kind} />
                    {report.target.removed && (
                      <Badge tone="danger">已移除</Badge>
                    )}
                  </span>
                  <span className="line-clamp-2 break-words text-ink-900 text-sm">
                    {targetText(report.target)}
                  </span>
                  <span className="truncate text-ink-500 text-xs">
                    {reasonLabel(report.reason)} · {reporterName(report)} ·{" "}
                    {formatRelative(report.createdAt)}
                  </span>
                </span>
              )}
              onOpen={(report) => setOpen(report)}
              activeKey={current?._id}
              compact={Boolean(current)}
              loading={reports.isPending}
              fetching={reports.isFetching && !reports.isPending}
              error={reports.isError ? errorText(reports.error) : null}
              onRetry={() => reports.refetch()}
              empty={
                status === "open"
                  ? "目前沒有待處理的檢舉"
                  : "沒有符合條件的檢舉"
              }
            />
          </ListCard>
        </div>

        <Drawer
          open={Boolean(current)}
          onClose={() => setOpen(null)}
          title={current ? `${kindLabel(current.target.kind)}檢舉` : "檢舉"}
          subtitle={current && formatDateTime(current.createdAt)}
          footer={
            current && (
              <>
                {!handled && (
                  <>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        setRequest({ report: current, action: "remove" })
                      }
                      disabled={busy}
                    >
                      <Trash2 aria-hidden className="size-3.5" />
                      移除內容
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        setRequest({ report: current, action: "dismiss" })
                      }
                      disabled={busy}
                    >
                      <Ban aria-hidden className="size-3.5" />
                      不處理
                    </Button>
                  </>
                )}
                {postId && (
                  <Link
                    href={`/post/${postId}`}
                    target="_blank"
                    className={`${buttonClass(handled ? "secondary" : "ghost", "sm")} ${handled ? "" : "ml-auto"}`}
                  >
                    <ExternalLink aria-hidden className="size-3.5" />
                    開啟貼文
                  </Link>
                )}
              </>
            )
          }
        >
          {current && (
            <>
              <div className="mb-3 flex flex-wrap gap-1.5">
                <StatusBadge status={current.status} />
                <KindBadge kind={current.target.kind} />
                {current.target.removed && (
                  <Badge tone="danger">內容已移除</Badge>
                )}
              </div>
              <p
                className={`whitespace-pre-wrap break-words rounded-control bg-field px-3 py-2 text-ink-800 text-sm leading-relaxed ${
                  current.target.kind === "post" ? "font-semibold" : ""
                }`}
              >
                {targetText(current.target)}
              </p>
              <dl className="mt-3">
                <InfoRow label="作者">
                  {current.target.author?.name || "已刪除的使用者"}
                </InfoRow>
                <InfoRow label="原因">{reasonLabel(current.reason)}</InfoRow>
                <InfoRow label="補充說明">
                  {current.note?.trim() ? (
                    <span className="whitespace-pre-wrap">{current.note}</span>
                  ) : (
                    <span className="text-ink-500">未填寫</span>
                  )}
                </InfoRow>
                <InfoRow label="檢舉人">
                  {reporterName(current)}
                  {current.reporter?.customId && (
                    <span className="text-ink-500">
                      {" "}
                      @{current.reporter.customId}
                    </span>
                  )}
                </InfoRow>
                <InfoRow label="檢舉時間">
                  {formatDateTime(current.createdAt)}
                </InfoRow>
              </dl>
              {handled && (
                <dl className="mt-2 border-line border-t pt-2">
                  <InfoRow label="處理結果">
                    <StatusBadge status={current.status} />
                  </InfoRow>
                  <InfoRow label="處理人">
                    {handlerName(current, admin.userId)}
                  </InfoRow>
                  <InfoRow label="處理說明">
                    {current.resolution?.trim() ? (
                      <span className="whitespace-pre-wrap">
                        {current.resolution}
                      </span>
                    ) : (
                      <span className="text-ink-500">未填寫</span>
                    )}
                  </InfoRow>
                  {current.updatedAt && (
                    <InfoRow label="處理時間">
                      {formatDateTime(current.updatedAt)}
                    </InfoRow>
                  )}
                </dl>
              )}
            </>
          )}
        </Drawer>
      </div>

      <ResolveDialog
        request={request}
        busy={busy}
        onCancel={() => setRequest(null)}
        onSubmit={resolve}
      />
    </>
  );
}

/** Confirms 移除內容 / 不處理 and takes the 處理說明 for the reporter. */
function ResolveDialog({
  request,
  busy,
  onCancel,
  onSubmit,
}: {
  request: ResolveRequest | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (resolution: string) => void;
}) {
  const [text, setText] = useState("");
  const textId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (request) {
      setText("");
    }
  }, [request]);

  const remove = request?.action === "remove";
  const noun = request ? kindLabel(request.report.target.kind) : "內容";

  return (
    <Modal
      open={Boolean(request)}
      onClose={() => {
        if (!busy) {
          onCancel();
        }
      }}
      title={remove ? `移除這則${noun}？` : "不處理這筆檢舉？"}
      description={
        remove
          ? `${noun}會被隱藏（之後可以在「${noun}」頁復原）。這則${noun}的所有待處理檢舉都會一起結案，並通知檢舉人處理結果。`
          : `${noun}會保留。這則${noun}的所有待處理檢舉都會一起結案，並通知檢舉人處理結果。`
      }
      initialFocus={textRef}
      footer={
        <>
          <Button onClick={onCancel} disabled={busy}>
            取消
          </Button>
          <Button
            variant={remove ? "danger" : "primary"}
            loading={busy}
            onClick={() => onSubmit(text.trim())}
          >
            {remove ? "移除內容" : "不處理"}
          </Button>
        </>
      }
    >
      <Field
        label="處理說明（選填）"
        htmlFor={textId}
        hint={
          <span className="flex justify-between gap-2">
            <span>會一併通知檢舉人</span>
            <span
              className={
                text.length >= RESOLUTION_MAX ? "text-warm-600" : undefined
              }
            >
              {text.length} / {RESOLUTION_MAX}
            </span>
          </span>
        }
      >
        <textarea
          ref={textRef}
          id={textId}
          value={text}
          onChange={(event) =>
            setText(event.target.value.slice(0, RESOLUTION_MAX))
          }
          maxLength={RESOLUTION_MAX}
          rows={3}
          disabled={busy}
          className={textareaClass}
        />
      </Field>
    </Modal>
  );
}

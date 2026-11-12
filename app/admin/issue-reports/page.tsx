"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Save, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { IssueImages } from "@/components/IssueReport/IssueImages";
import {
  IssueCategoryChip,
  IssueStatusChip,
} from "@/components/IssueReport/IssueStatusChip";
import { toast } from "@/components/mobile/Toast";
import {
  formatViewport,
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABEL,
  ISSUE_REPLY_MAX,
  ISSUE_STATUS_LABEL,
  ISSUE_STATUSES,
  type IssueCategory,
  type IssueStatus,
  isIssueStatus,
  textLength,
} from "@/modules/issueReports";
import {
  errorText,
  failureMessage,
  isObjectId,
  PAGE_SIZE,
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
import { Pagination, pageCount } from "../(admin)/components/Pagination";
import {
  Avatar,
  Button,
  Field,
  InfoRow,
  linkClass,
  selectClass,
  textareaClass,
} from "../(admin)/components/ui";
import { useAdmin } from "../(admin)/context";
import { formatCount, formatDateTime, formatRelative } from "../(admin)/format";
import {
  type AdminIssueReport,
  type IssuePage,
  type IssueStatusFilter,
  issueKeys,
  normalizeAdminIssue,
  updateIssueReport,
  useIssueReport,
  useIssueReports,
} from "../(admin)/issueReportsApi";
import { oneOf, useQueryState } from "../(admin)/useQueryState";

// 問題回報 (contract v4 §7): what users report from /report. The default
// queue is 待處理 + 處理中. An admin sets the status and replies; a new
// reply, or moving a report to 已解決 / 不處理, notifies the reporter.
// `?id=` opens a report (the admin notification links here).

const STATUS_FILTERS: readonly IssueStatusFilter[] = [
  "active",
  "open",
  "in_progress",
  "resolved",
  "closed",
  "all",
];
const STATUS_OPTIONS = [
  { value: "active", label: "待處理＋處理中" },
  ...ISSUE_STATUSES.map((value) => ({
    value,
    label: ISSUE_STATUS_LABEL[value],
  })),
  { value: "all", label: "全部" },
];

const CATEGORY_FILTERS: readonly (IssueCategory | "all")[] = [
  "all",
  ...ISSUE_CATEGORIES,
];
const CATEGORY_OPTIONS = [
  { value: "all", label: "全部類型" },
  ...ISSUE_CATEGORIES.map((value) => ({
    value,
    label: ISSUE_CATEGORY_LABEL[value],
  })),
];

function reporterName(report: AdminIssueReport) {
  return report.reporter?.name || "已刪除的使用者";
}

/** Whether saving these changes notifies the reporter (as the backend). */
function notifies(
  report: AdminIssueReport,
  status: IssueStatus,
  reply: string,
) {
  const replyChanged = reply !== report.reply;
  const closing =
    status !== report.status && (status === "resolved" || status === "closed");
  return (replyChanged && reply !== "") || closing;
}

/** The admin users page with this person's drawer open. */
function userHref(person: NonNullable<AdminIssueReport["reporter"]>) {
  const params = new URLSearchParams();
  const key = person.email || person.customId || person.name;
  if (key) {
    params.set("q", key);
  }
  params.set("id", person._id);
  return `/admin/users?${params.toString()}`;
}

function PageLink({ url }: { url: string }) {
  if (!url) {
    return <span className="text-ink-500">未提供</span>;
  }
  const internal = url.startsWith("/") && !url.startsWith("//");
  if (internal) {
    return (
      <Link href={url} target="_blank" className={`${linkClass} break-all`}>
        {url}
      </Link>
    );
  }
  if (/^https?:\/\//i.test(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${linkClass} break-all`}
      >
        {url}
      </a>
    );
  }
  return <span className="break-all">{url}</span>;
}

type Draft = { id: string; status: IssueStatus; reply: string };

export default function AdminIssueReportsPage() {
  const admin = useAdmin();
  const queryClient = useQueryClient();
  const { get, set, page } = useQueryState();
  const status = oneOf(get("status"), STATUS_FILTERS, "active");
  const category = oneOf(get("category"), CATEGORY_FILTERS, "all");
  const q = get("q");
  const idParam = get("id");
  const openId = isObjectId(idParam) ? idParam : null;

  const reports = useIssueReports({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    status,
    category: category === "all" ? undefined : category,
    q: q || undefined,
  });
  const items = reports.data?.items ?? [];
  const total = reports.data?.total ?? 0;
  const pages = pageCount(total, PAGE_SIZE);
  const fromList = openId ? items.find((r) => r._id === openId) : undefined;
  // `?id=` of a report that is not on this page (or filtered out).
  const detail = useIssueReport(
    openId && reports.isSuccess && !fromList ? openId : null,
  );
  const current = fromList ?? (openId ? detail.data : undefined) ?? null;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const statusId = useId();
  const replyId = useId();
  const replyErrorId = useId();

  useEffect(() => {
    if (reports.isSuccess && !reports.isPlaceholderData && page > pages) {
      set({ page: pages > 1 ? pages : null }, { replace: true });
    }
  }, [reports.isSuccess, reports.isPlaceholderData, page, pages]);

  // A fresh form for each report opened.
  useEffect(() => {
    if (current && draft?.id !== current._id) {
      setDraft({
        id: current._id,
        status: current.status,
        reply: current.reply,
      });
      setReplyError(null);
    }
  }, [current?._id]);

  useEffect(() => {
    if (detail.isError && openId) {
      toast.error("找不到這筆回報，可能已經被移除");
      set({ id: null }, { keepPage: true, replace: true });
    }
  }, [detail.isError]);

  // Bad ids in the address bar are dropped.
  useEffect(() => {
    if (idParam && !openId) {
      set({ id: null }, { keepPage: true, replace: true });
    }
  }, [idParam, openId]);

  const open = (report: AdminIssueReport) =>
    set({ id: report._id }, { keepPage: true, replace: true });
  const close = () => set({ id: null }, { keepPage: true, replace: true });

  const form = current && draft?.id === current._id ? draft : null;
  const dirty = Boolean(
    current &&
      form &&
      (form.status !== current.status || form.reply.trim() !== current.reply),
  );

  const save = async () => {
    if (!current || !form || saving) {
      return;
    }
    const reply = form.reply.trim();
    if (textLength(reply) > ISSUE_REPLY_MAX) {
      setReplyError(`回覆最多 ${ISSUE_REPLY_MAX} 字`);
      document.getElementById(replyId)?.focus();
      return;
    }
    const body: { status?: IssueStatus; reply?: string } = {};
    if (form.status !== current.status) {
      body.status = form.status;
    }
    if (reply !== current.reply) {
      body.reply = reply;
    }
    if (Object.keys(body).length === 0) {
      return;
    }
    const willNotify = notifies(current, form.status, reply);
    setSaving(true);
    const result = await updateIssueReport(current._id, body);
    setSaving(false);
    if (!result.ok) {
      if (result.kind === "not-found") {
        toast.error("找不到這筆回報，可能已經被移除");
        close();
        await queryClient.invalidateQueries({ queryKey: issueKeys.all });
        return;
      }
      toast.error(`沒有儲存：${failureMessage(result)}`);
      return;
    }
    const updated: AdminIssueReport = normalizeAdminIssue(result.data) ?? {
      ...current,
      status: form.status,
      reply,
      repliedAt:
        reply !== current.reply
          ? reply
            ? new Date().toISOString()
            : null
          : current.repliedAt,
    };
    // Show it at once, then refetch the lists and the badge.
    queryClient.setQueryData(issueKeys.detail(current._id), updated);
    queryClient.setQueriesData<IssuePage>(
      { queryKey: [...issueKeys.all, "list"] },
      (old) =>
        old
          ? {
              ...old,
              items: old.items.map((item) =>
                item._id === updated._id ? updated : item,
              ),
            }
          : old,
    );
    setDraft({ id: updated._id, status: updated.status, reply: updated.reply });
    toast.success(willNotify ? "已儲存，並通知回報者" : "已儲存");
    await queryClient.invalidateQueries({ queryKey: issueKeys.all });
  };

  const columns: Column<AdminIssueReport>[] = [
    {
      key: "title",
      header: "標題",
      primary: true,
      cell: (report) => (
        <Truncate className="font-medium text-ink-900">{report.title}</Truncate>
      ),
    },
    {
      key: "category",
      header: "類型",
      className: "w-[6.5rem]",
      cell: (report) => <IssueCategoryChip category={report.category} />,
    },
    {
      key: "reporter",
      optional: true,
      header: "回報者",
      className: "w-[16%]",
      cell: (report) => <Truncate>{reporterName(report)}</Truncate>,
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
    {
      key: "status",
      header: "狀態",
      className: "w-[6rem]",
      cell: (report) => <IssueStatusChip status={report.status} />,
    },
  ];

  const filtered = status !== "active" || category !== "all" || Boolean(q);
  const handler = current?.handledBy;
  const replyLength = form ? textLength(form.reply.trim()) : 0;

  return (
    <>
      <PageHeader
        title="問題回報"
        description={
          reports.data
            ? `共 ${formatCount(total)} 筆 · 待處理 ${formatCount(
                reports.data.openCount,
              )} 筆`
            : "載入中…"
        }
      />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <ListCard
            toolbar={
              <FilterBar>
                <SearchBox
                  value={q}
                  onCommit={(next) => set({ q: next }, { replace: true })}
                  label="搜尋回報"
                  placeholder="標題或說明…"
                  className="sm:flex-1"
                />
                <SelectFilter
                  label="狀態"
                  value={status}
                  options={STATUS_OPTIONS}
                  onChange={(next) =>
                    set({ status: next === "active" ? null : next })
                  }
                  className="sm:w-40"
                />
                <SelectFilter
                  label="類型"
                  value={category}
                  options={CATEGORY_OPTIONS}
                  onChange={(next) =>
                    set({ category: next === "all" ? null : next })
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
              caption="問題回報列表"
              rows={items}
              rowKey={(report) => report._id}
              rowLabel={(report) =>
                `${ISSUE_CATEGORY_LABEL[report.category]}：${report.title.slice(0, 40)}`
              }
              columns={columns}
              card={(report) => (
                <span className="flex flex-col gap-1">
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <IssueStatusChip status={report.status} />
                    <IssueCategoryChip category={report.category} />
                  </span>
                  <span className="line-clamp-2 break-words font-medium text-ink-900 text-sm">
                    {report.title}
                  </span>
                  <span className="truncate text-ink-500 text-xs">
                    {reporterName(report)} · {formatRelative(report.createdAt)}
                  </span>
                </span>
              )}
              onOpen={open}
              activeKey={current?._id}
              compact={Boolean(current)}
              loading={reports.isPending}
              fetching={reports.isFetching && !reports.isPending}
              error={reports.isError ? errorText(reports.error) : null}
              onRetry={() => reports.refetch()}
              empty={filtered ? "沒有符合條件的回報" : "目前沒有待處理的回報"}
            />
          </ListCard>
        </div>

        <Drawer
          open={Boolean(current)}
          onClose={close}
          title={current?.title ?? "問題回報"}
          subtitle={current && formatDateTime(current.createdAt)}
          footer={
            current &&
            form && (
              <Button
                size="sm"
                variant="primary"
                loading={saving}
                disabled={!dirty || saving}
                onClick={save}
              >
                {!saving && <Save aria-hidden className="size-3.5" />}
                儲存
              </Button>
            )
          }
        >
          {current && (
            <>
              <div className="mb-3 flex flex-wrap gap-1.5">
                <IssueStatusChip status={current.status} />
                <IssueCategoryChip category={current.category} />
              </div>
              <p className="whitespace-pre-wrap break-words rounded-control bg-field px-3 py-2 text-ink-800 text-sm leading-relaxed">
                {current.description}
              </p>
              {current.images.length > 0 && (
                <div className="mt-3">
                  <IssueImages ids={current.images} size="sm" />
                </div>
              )}

              <dl className="mt-3">
                <InfoRow label="回報者">
                  {current.reporter ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar
                        src={current.reporter.avatar}
                        name={current.reporter.name}
                        size={24}
                      />
                      <span className="min-w-0">
                        <Link
                          href={userHref(current.reporter)}
                          className={`${linkClass} break-words`}
                        >
                          {reporterName(current)}
                        </Link>
                        {current.reporter.customId && (
                          <span className="text-ink-500">
                            {" "}
                            @{current.reporter.customId}
                          </span>
                        )}
                        {current.reporter.email && (
                          <span className="block break-all text-ink-500 text-xs">
                            {current.reporter.email}
                          </span>
                        )}
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-ink-500">
                      <UserRound aria-hidden className="size-4" />
                      已刪除的使用者
                    </span>
                  )}
                </InfoRow>
                <InfoRow label="回報時間">
                  {formatDateTime(current.createdAt)}
                </InfoRow>
              </dl>

              <h3 className="mt-3 mb-1 border-line border-t pt-3 font-semibold text-ink-700 text-xs">
                回報時的環境
              </h3>
              <dl>
                <InfoRow label="頁面">
                  <PageLink url={current.context.pageUrl} />
                </InfoRow>
                <InfoRow label="版本">
                  {current.context.appVersion ? (
                    `v${current.context.appVersion.replace(/^v/, "")}`
                  ) : (
                    <span className="text-ink-500">未提供</span>
                  )}
                </InfoRow>
                <InfoRow label="瀏覽器">
                  {current.context.userAgent ? (
                    <span className="break-all text-xs leading-5">
                      {current.context.userAgent}
                    </span>
                  ) : (
                    <span className="text-ink-500">未提供</span>
                  )}
                </InfoRow>
                <InfoRow label="螢幕大小">
                  {current.context.viewport ? (
                    formatViewport(current.context.viewport)
                  ) : (
                    <span className="text-ink-500">未提供</span>
                  )}
                </InfoRow>
                {current.context.errorDigest && (
                  <InfoRow label="錯誤代碼">
                    <span className="break-all font-mono text-xs">
                      {current.context.errorDigest}
                    </span>
                  </InfoRow>
                )}
              </dl>

              {form && (
                <div className="mt-3 flex flex-col gap-3 border-line border-t pt-3">
                  <Field label="狀態" htmlFor={statusId}>
                    <select
                      id={statusId}
                      value={form.status}
                      disabled={saving}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (isIssueStatus(next)) {
                          setDraft({ ...form, status: next });
                        }
                      }}
                      className={selectClass}
                    >
                      {ISSUE_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {ISSUE_STATUS_LABEL[value]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="回覆"
                    htmlFor={replyId}
                    hint={
                      <span className="flex justify-between gap-2">
                        <span>
                          {replyError ? (
                            <span
                              id={replyErrorId}
                              className="text-danger-700 text-sm"
                            >
                              {replyError}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={`shrink-0 tabular-nums ${
                            replyLength > ISSUE_REPLY_MAX
                              ? "text-danger-700"
                              : ""
                          }`}
                        >
                          {replyLength} / {ISSUE_REPLY_MAX}
                        </span>
                      </span>
                    }
                  >
                    <textarea
                      id={replyId}
                      value={form.reply}
                      rows={5}
                      disabled={saving}
                      aria-invalid={Boolean(replyError)}
                      aria-describedby={replyError ? replyErrorId : undefined}
                      onChange={(event) => {
                        setDraft({ ...form, reply: event.target.value });
                        setReplyError(null);
                      }}
                      className={textareaClass}
                    />
                  </Field>
                  <p className="rounded-control bg-brand-50 px-3 py-2 text-brand-800 text-xs leading-5">
                    儲存時，如果寫了新的回覆，或把狀態改成「已解決」或「不處理」，回報者會收到通知，並在「我的回報」看到回覆。
                  </p>
                  {(handler || current.repliedAt) && (
                    <dl>
                      {handler && (
                        <InfoRow label="處理人">
                          {handler._id === admin.userId
                            ? "你"
                            : handler.name || "管理員"}
                        </InfoRow>
                      )}
                      {current.repliedAt && (
                        <InfoRow label="回覆時間">
                          {formatDateTime(current.repliedAt)}
                        </InfoRow>
                      )}
                    </dl>
                  )}
                </div>
              )}
            </>
          )}
        </Drawer>
      </div>
    </>
  );
}

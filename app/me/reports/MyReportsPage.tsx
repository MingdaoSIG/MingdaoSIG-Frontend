"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown, MessageSquareReply, Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { DocPage } from "@/components/desktop/DocPage";
import { IssueImages } from "@/components/IssueReport/IssueImages";
import {
  IssueCategoryChip,
  IssueStatusChip,
} from "@/components/IssueReport/IssueStatusChip";
import { PageTitle } from "@/components/mobile/PageTitle";
import { ApiError, apiRequest, getErrorMessage } from "@/modules/api/client";
import {
  formatIssueDate,
  type IssueReport,
  normalizeIssueReport,
} from "@/modules/issueReports";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

// 個人專區 → 我的回報 (contract v4 §7): the user's 問題回報, newest first,
// with the status and the admin's reply. `?id=` (the notification link)
// opens that report and scrolls to it, loading more pages if needed.

const PAGE_SIZE = 20;
/** How far `?id=` may page to find its report. */
const MAX_PAGES_FOR_ID = 10;

type MinePage = { items: IssueReport[]; total: number };

const card = "rounded-card border border-line bg-surface shadow-card";
const primaryButton =
  "flex h-10 shrink-0 items-center gap-1.5 rounded-control bg-brand-700 px-4 font-semibold text-sm text-white transition-colors hover:bg-brand-800";

async function fetchMine(skip: number, signal: AbortSignal) {
  const result = await apiRequest<unknown>("/issue-report/mine", {
    auth: true,
    query: { skip, limit: PAGE_SIZE },
    signal,
  });
  if (!result.ok) {
    throw new ApiError(result);
  }
  const items = Array.isArray(result.data)
    ? result.data.flatMap((item) => {
        const report = normalizeIssueReport(item);
        return report ? [report] : [];
      })
    : [];
  const total =
    typeof result.body.total === "number" ? result.body.total : items.length;
  return { items, total } satisfies MinePage;
}

function useMyReports(userId: string) {
  return useInfiniteQuery<MinePage, Error>({
    queryKey: ["issue-reports", "mine", userId],
    queryFn: ({ pageParam, signal }) =>
      fetchMine(Number(pageParam) * PAGE_SIZE, signal),
    enabled: Boolean(userId),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, page) => n + page.items.length, 0);
      return lastPage.items.length === PAGE_SIZE && loaded < lastPage.total
        ? allPages.length
        : undefined;
    },
  });
}

function NewReportLink() {
  return (
    <Link href="/report" className={primaryButton}>
      <Plus size={16} aria-hidden />
      回報新問題
    </Link>
  );
}

function ReportItem({
  report,
  open,
  onToggle,
  highlight,
}: {
  report: IssueReport;
  open: boolean;
  onToggle: () => void;
  highlight: boolean;
}) {
  const panelId = `issue-${report._id}`;
  return (
    <li
      id={`report-${report._id}`}
      className={`scroll-mt-[calc(var(--shell-top,5rem)+0.5rem)] ${
        highlight ? "bg-brand-50/60" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-field focus-visible:bg-field focus-visible:outline-none lg:px-5"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-1.5">
            <IssueStatusChip status={report.status} />
            <IssueCategoryChip category={report.category} />
            <span className="text-ink-500 text-xs tabular-nums">
              {formatIssueDate(report.createdAt)}
            </span>
            {report.reply && (
              <span className="flex items-center gap-1 font-semibold text-brand-700 text-xs">
                <MessageSquareReply aria-hidden className="size-3.5" />
                已回覆
              </span>
            )}
          </span>
          <span className="break-words font-semibold text-ink-900 leading-6">
            {report.title}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={`mt-1 size-5 shrink-0 text-ink-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div
          id={panelId}
          className="flex flex-col gap-4 px-4 pt-1 pb-5 lg:px-5"
        >
          <p className="whitespace-pre-wrap break-words text-ink-800 text-sm leading-7">
            {report.description}
          </p>
          <IssueImages ids={report.images} />
          <Reply report={report} />
        </div>
      )}
    </li>
  );
}

function Reply({ report }: { report: IssueReport }) {
  if (!report.reply) {
    return (
      <p className="rounded-control bg-field px-3 py-2.5 text-ink-500 text-sm">
        {report.status === "open" || report.status === "in_progress"
          ? "管理員還沒有回覆。回覆時你會收到通知。"
          : "管理員沒有留下回覆。"}
      </p>
    );
  }
  return (
    <section
      aria-label="管理員回覆"
      className="rounded-control border border-brand-700/15 bg-brand-50/70 px-3.5 py-3"
    >
      <p className="mb-1 flex flex-wrap items-baseline gap-x-2 font-semibold text-brand-800 text-sm">
        管理員回覆
        {report.repliedAt && (
          <span className="font-normal text-ink-500 text-xs tabular-nums">
            {formatIssueDate(report.repliedAt)}
          </span>
        )}
      </p>
      <p className="whitespace-pre-wrap break-words text-ink-800 text-sm leading-7">
        {report.reply}
      </p>
    </section>
  );
}

function ReportList({ userId }: { userId: string }) {
  const params = useSearchParams();
  const targetId = params.get("id");
  const query = useMyReports(userId);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [missing, setMissing] = useState(false);
  const scrolledFor = useRef<string | null>(null);

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const found = targetId ? items.some((r) => r._id === targetId) : false;

  // `?id=`: page until the report shows up, then open it and scroll to it.
  useEffect(() => {
    if (!targetId || !query.isSuccess) {
      return;
    }
    if (found) {
      setMissing(false);
      setOpenIds((current) =>
        current.has(targetId) ? current : new Set(current).add(targetId),
      );
      if (scrolledFor.current !== targetId) {
        scrolledFor.current = targetId;
        requestAnimationFrame(() => {
          document
            .getElementById(`report-${targetId}`)
            ?.scrollIntoView({ block: "start", behavior: "smooth" });
        });
      }
      return;
    }
    const pages = query.data?.pages.length ?? 0;
    if (
      query.hasNextPage &&
      !query.isFetchingNextPage &&
      pages < MAX_PAGES_FOR_ID
    ) {
      void query.fetchNextPage();
      return;
    }
    if (!query.isFetchingNextPage) {
      setMissing(true);
    }
  }, [
    targetId,
    found,
    query.isSuccess,
    query.hasNextPage,
    query.isFetchingNextPage,
  ]);

  if (query.isPending) {
    return (
      <div aria-hidden className={`${card} flex flex-col gap-3 p-5`}>
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex flex-col gap-2">
            <div className="h-4 w-40 animate-pulse rounded-chip bg-field" />
            <div className="h-5 w-3/4 animate-pulse rounded-chip bg-field" />
          </div>
        ))}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div
        role="alert"
        className={`${card} flex flex-col items-start gap-3 p-5 text-sm`}
      >
        <p className="text-ink-700">
          我的回報載入失敗：{getErrorMessage(query.error)}
        </p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="h-9 cursor-pointer rounded-control border border-line-strong px-4 font-semibold text-ink-700 hover:bg-field"
        >
          重試
        </button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div
        className={`${card} flex flex-col items-center gap-3 px-6 py-10 text-center`}
      >
        <p className="text-ink-700">你還沒有回報過問題。</p>
        <NewReportLink />
      </div>
    );
  }

  return (
    <>
      {missing && targetId && (
        <output className="block rounded-control border border-line bg-surface px-4 py-3 text-ink-700 text-sm">
          找不到這筆回報，可能已經被移除。
        </output>
      )}
      <section aria-label="回報列表" className={`${card} overflow-hidden`}>
        <ul className="divide-y divide-line">
          {items.map((report) => (
            <ReportItem
              key={report._id}
              report={report}
              open={openIds.has(report._id)}
              highlight={report._id === targetId}
              onToggle={() =>
                setOpenIds((current) => {
                  const next = new Set(current);
                  if (next.has(report._id)) {
                    next.delete(report._id);
                  } else {
                    next.add(report._id);
                  }
                  return next;
                })
              }
            />
          ))}
        </ul>
      </section>
      <div className="flex flex-col items-center gap-2 pb-2">
        <p className="text-ink-500 text-xs tabular-nums">
          已顯示 {items.length} / {total} 筆
        </p>
        {query.hasNextPage && (
          <button
            type="button"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="h-10 cursor-pointer rounded-control border border-line-strong bg-surface px-5 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-60"
          >
            {query.isFetchingNextPage ? "載入中…" : "載入更多"}
          </button>
        )}
      </div>
    </>
  );
}

export default function MyReportsPage() {
  const isMobile = useIsMobile();
  const { isLogin, isLoading, userData, login } = useUserAccount();
  const userId = userData?._id ?? "";

  let body: ReactNode;
  if (isLoading) {
    body = <div aria-hidden className={`${card} h-40 animate-pulse`} />;
  } else if (!isLogin || !userId) {
    body = (
      <section
        className={`${card} flex flex-col items-center gap-3 px-6 py-10 text-center`}
      >
        <p className="text-ink-700">登入後才能查看你的回報。</p>
        <button
          type="button"
          onClick={() => login()}
          className="h-10 cursor-pointer rounded-control bg-brand-700 px-6 font-semibold text-sm text-white hover:bg-brand-800"
        >
          登入
        </button>
      </section>
    );
  } else {
    body = <ReportList userId={userId} />;
  }

  const showNew = isLogin && !isLoading;
  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <PageTitle title="我的回報" />
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
          {showNew && (
            <div className="flex justify-end">
              <NewReportLink />
            </div>
          )}
          {body}
        </div>
      </div>
    );
  }
  return (
    <DocPage
      title="我的回報"
      description="你回報的問題、處理狀態與管理員的回覆"
      width="narrow"
      actions={showNew ? <NewReportLink /> : undefined}
    >
      {body}
    </DocPage>
  );
}

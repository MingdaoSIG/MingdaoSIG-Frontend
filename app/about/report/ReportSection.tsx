"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bug,
  Lightbulb,
  LogIn,
  type LucideIcon,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";
import { IssueStatusChip } from "@/components/IssueReport/IssueStatusChip";
import { ApiError, apiRequest, getErrorMessage } from "@/modules/api/client";
import {
  formatIssueDate,
  type IssueCategory,
  type IssueReport,
  issueReportHref,
  normalizeIssueReport,
} from "@/modules/issueReports";
import { useUserAccount } from "@/utils/useUserAccount";
import { HelpCard, HelpPage } from "../HelpPage";

// 回報問題 in the help centre (decision 3A): the three report types and
// the signed-in user's latest reports with their status. Logged out it
// says 「登入後才能回報」.

const TYPES: {
  category: IssueCategory;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  {
    category: "bug",
    label: "回報錯誤",
    hint: "網站壞掉、按了沒反應、顯示不對",
    icon: Bug,
  },
  {
    category: "suggestion",
    label: "提出建議",
    hint: "想要的新功能或改進",
    icon: Lightbulb,
  },
  {
    category: "account",
    label: "帳號問題",
    hint: "登入、個人資料、權限",
    icon: UserRoundCog,
  },
];

const RECENT = 3;

function useRecentReports(userId: string) {
  return useQuery<IssueReport[], Error>({
    queryKey: ["issue-reports", "recent", userId],
    queryFn: async ({ signal }) => {
      const result = await apiRequest<unknown>("/issue-report/mine", {
        auth: true,
        query: { skip: 0, limit: RECENT },
        signal,
      });
      if (!result.ok) {
        throw new ApiError(result);
      }
      return Array.isArray(result.data)
        ? result.data
            .flatMap((item) => {
              const report = normalizeIssueReport(item);
              return report ? [report] : [];
            })
            .slice(0, RECENT)
        : [];
    },
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });
}

function RecentReports({ userId }: { userId: string }) {
  const recent = useRecentReports(userId);
  let body: React.ReactNode;
  if (recent.isPending) {
    body = (
      <div aria-hidden className="flex flex-col gap-2">
        {["a", "b"].map((key) => (
          <div
            key={key}
            className="h-12 animate-pulse rounded-control bg-field"
          />
        ))}
      </div>
    );
  } else if (recent.isError) {
    body = (
      <p role="alert" className="text-ink-500 text-sm">
        無法載入你的回報：{getErrorMessage(recent.error)}
        <button
          type="button"
          onClick={() => void recent.refetch()}
          className="ml-2 cursor-pointer font-semibold text-brand-700 hover:underline"
        >
          重試
        </button>
      </p>
    );
  } else if (recent.data.length === 0) {
    body = <p className="text-ink-500 text-sm">你還沒有回報過問題。</p>;
  } else {
    body = (
      <ul className="divide-y divide-line rounded-control border border-line">
        {recent.data.map((report) => (
          <li key={report._id}>
            <Link
              href={`/me/reports?id=${report._id}`}
              data-my-report={report._id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-field"
            >
              <IssueStatusChip status={report.status} />
              <span className="min-w-0 flex-1 truncate text-ink-900 text-sm">
                {report.title}
              </span>
              <span className="shrink-0 text-ink-500 text-xs tabular-nums">
                {formatIssueDate(report.createdAt).slice(5, 10)}
                {report.reply ? "・管理員已回覆" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <HelpCard
      title="我的回報"
      id="mine"
      action={
        <Link
          href="/me/reports"
          className="flex items-center gap-1 font-semibold text-brand-700 text-sm hover:underline"
        >
          查看全部
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      }
    >
      {body}
    </HelpCard>
  );
}

export function ReportSection() {
  const { isLogin, isLoading, login, userData } = useUserAccount();

  return (
    <HelpPage
      title="回報問題"
      description="選擇類型開始回報，處理進度會通知你。"
    >
      <HelpCard title="要回報什麼？" id="types">
        {isLoading ? (
          <div
            aria-hidden
            className="h-24 animate-pulse rounded-control bg-field"
          />
        ) : isLogin ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <li key={type.category} className="min-w-0">
                  <Link
                    href={issueReportHref({
                      category: type.category,
                      from: "/about/report",
                    })}
                    data-report-type={type.category}
                    className="flex h-full flex-col gap-1 rounded-control border border-line-strong px-4 py-3 transition-colors hover:border-brand-700/50 hover:bg-brand-50/60"
                  >
                    <span className="flex items-center gap-2 font-bold text-[0.9375rem] text-ink-900">
                      <Icon aria-hidden className="size-4 text-brand-700" />
                      {type.label}
                    </span>
                    <span className="text-ink-500 text-xs leading-5">
                      {type.hint}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div
            data-report-login
            className="flex flex-col items-center gap-3 rounded-control bg-field px-4 py-6 text-center"
          >
            <p className="font-semibold text-ink-800">登入後才能回報</p>
            <p className="text-ink-500 text-sm">
              用學校帳號登入，回報錯誤、提出建議或帳號問題，並看到處理進度。
            </p>
            <button
              type="button"
              onClick={() => login()}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-control bg-brand-700 px-6 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
            >
              <LogIn aria-hidden className="size-4" />
              登入
            </button>
          </div>
        )}
      </HelpCard>
      {isLogin && userData?._id && <RecentReports userId={userData._id} />}
      <HelpCard title="回報前可以先看看" id="before">
        <p className="text-[0.9375rem] text-ink-700 leading-[1.75]">
          很多問題在
          <Link
            href="/about/faq"
            className="mx-1 text-brand-700 underline decoration-brand-700/30 underline-offset-[0.2em] hover:text-brand-800"
          >
            常見問題
          </Link>
          有答案。網站整個打不開時，先看
          <Link
            href="/about/status"
            className="mx-1 text-brand-700 underline decoration-brand-700/30 underline-offset-[0.2em] hover:text-brand-800"
          >
            運行狀態
          </Link>
          。看到不當的貼文或留言，請用貼文上的「檢舉」。
        </p>
      </HelpCard>
    </HelpPage>
  );
}

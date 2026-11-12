import {
  ISSUE_CATEGORY_LABEL,
  ISSUE_STATUS_LABEL,
  type IssueCategory,
  type IssueStatus,
} from "@/modules/issueReports";

// The status of a 問題回報, one colour each: 待處理 warm, 處理中 brand,
// 已解決 green, 不處理 grey. Shared by /me/reports and the admin page.

const STATUS_TONE: Record<IssueStatus, string> = {
  open: "bg-warm-50 text-warm-600",
  in_progress: "bg-brand-50 text-brand-800",
  resolved: "bg-ok-50 text-ok-700",
  closed: "bg-field text-ink-500",
};

const chip =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-chip px-1.5 py-px font-semibold text-xs leading-5";

export function IssueStatusChip({ status }: { status: IssueStatus }) {
  return (
    <span className={`${chip} ${STATUS_TONE[status]}`}>
      {ISSUE_STATUS_LABEL[status]}
    </span>
  );
}

export function IssueCategoryChip({ category }: { category: IssueCategory }) {
  return (
    <span className={`${chip} border border-line bg-surface text-ink-700`}>
      {ISSUE_CATEGORY_LABEL[category]}
    </span>
  );
}

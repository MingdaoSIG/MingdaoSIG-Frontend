import { Flag } from "lucide-react";
import Link from "next/link";

// 「找不到答案？回報問題」 (decision 1B): at the bottom of the help
// centre's table of contents on desktop, at the end of every page on
// phones. It leads to the report section (/about/report).

export function ReportStrip({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      aria-label="回報問題"
      data-report-strip
      className={`flex shrink-0 rounded-card border border-brand-700/20 bg-brand-50 ${
        compact
          ? "flex-col gap-2 p-3"
          : "flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-bold text-ink-900 text-sm">找不到答案？</p>
        <p className="mt-0.5 text-ink-700 text-xs leading-5">
          登入後回報，處理進度會通知你
        </p>
      </div>
      <Link
        href="/about/report"
        className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-control bg-brand-700 px-4 font-semibold text-sm text-white transition-colors hover:bg-brand-800 ${
          compact ? "w-full" : ""
        }`}
      >
        <Flag aria-hidden className="size-4" />
        回報問題
      </Link>
    </aside>
  );
}

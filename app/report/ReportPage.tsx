"use client";

import { LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { DocPage } from "@/components/desktop/DocPage";
import { PageTitle } from "@/components/mobile/PageTitle";
import { isIssueCategory } from "@/modules/issueReports";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
import { cardClass, IssueReportForm } from "./IssueReportForm";

// 回報問題 (contract v4 §7), replacing the old Google Form. Signing in is
// required. `?category=` picks the type, `?from=` is the page the report
// is about and `?digest=` the error code (from the error pages).

export default function ReportPage() {
  const isMobile = useIsMobile();
  const params = useSearchParams();
  const { isLogin, isLoading, login } = useUserAccount();
  const category = params.get("category");
  const from = params.get("from");
  const digest = params.get("digest");

  let body: ReactNode;
  if (isLoading) {
    body = (
      <div
        aria-hidden
        className={`${cardClass} h-72 animate-pulse bg-surface`}
      />
    );
  } else if (!isLogin) {
    body = (
      <section
        className={`${cardClass} mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-6 py-10 text-center`}
      >
        <p className="font-semibold text-ink-800">登入後才能回報問題</p>
        <button
          type="button"
          onClick={() => login()}
          className="flex h-11 cursor-pointer items-center gap-2 rounded-control bg-brand-700 px-6 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
        >
          <LogIn size={16} aria-hidden />
          登入
        </button>
      </section>
    );
  } else {
    body = (
      <IssueReportForm
        initialCategory={isIssueCategory(category) ? category : "bug"}
        from={from}
        digest={digest}
      />
    );
  }

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <PageTitle title="回報問題" />
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
          {body}
        </div>
      </div>
    );
  }
  return (
    <DocPage
      title="回報問題"
      description="網站的錯誤、建議或帳號問題，都可以在這裡告訴管理員。"
      width="narrow"
    >
      {body}
    </DocPage>
  );
}

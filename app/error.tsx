"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { issueReportHref } from "@/modules/issueReports";

// Route-level error boundary: a crash inside one page shows this card
// (inside the normal header and navigation) instead of a blank
// "Application error" screen.

const DRAFT_KEYS = ["postData", "editorContent"];

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [hasDraft, setHasDraft] = useState(false);
  const pathname = usePathname();
  const [from, setFrom] = useState(pathname);

  // The page that failed, with its query (read after mounting).
  useEffect(() => {
    setFrom(`${window.location.pathname}${window.location.search}`);
  }, [pathname]);

  useEffect(() => {
    console.error("Page crashed:", error);
    try {
      setHasDraft(DRAFT_KEYS.some((key) => localStorage.getItem(key)));
    } catch {
      setHasDraft(false);
    }
  }, [error]);

  function clearDraftAndReload() {
    try {
      for (const key of DRAFT_KEYS) {
        localStorage.removeItem(key);
      }
    } catch {
      // storage unavailable; reload anyway
    }
    window.location.reload();
  }

  const button =
    "inline-flex h-10 cursor-pointer items-center justify-center rounded-control px-4 font-medium text-sm transition-colors";

  return (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 text-center shadow-card">
        <h1 className="mb-2 font-semibold text-ink-900 text-xl">
          這個頁面暫時無法顯示
        </h1>
        <p className="mb-5 text-ink-700 text-sm leading-6">
          很抱歉，頁面發生錯誤。請先重試；如果一直出現，可以回到首頁。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className={`${button} bg-brand-700 text-white hover:bg-brand-800`}
            onClick={() => reset()}
          >
            重試
          </button>
          <Link
            href="/"
            className={`${button} border border-line text-ink-800 hover:bg-field`}
          >
            回首頁
          </Link>
        </div>
        {hasDraft && (
          <div className="mt-5 border-line border-t pt-4 text-ink-500 text-xs leading-5">
            <p className="mb-2">
              如果是在發文頁一直出錯，可能是本機暫存的草稿有問題。清除後草稿會消失。
            </p>
            <button
              type="button"
              className="cursor-pointer text-brand-700 underline-offset-2 hover:underline"
              onClick={clearDraftAndReload}
            >
              清除暫存草稿並重新載入
            </button>
          </div>
        )}
        <p className="mt-4 text-ink-500 text-sm">
          <Link
            href={issueReportHref({
              category: "bug",
              from,
              digest: error.digest,
            })}
            className="font-medium text-brand-700 underline-offset-2 hover:underline"
          >
            回報這個問題
          </Link>
        </p>
        {error.digest && (
          <p className="mt-2 text-ink-400 text-xs">錯誤代碼：{error.digest}</p>
        )}
      </div>
    </div>
  );
}

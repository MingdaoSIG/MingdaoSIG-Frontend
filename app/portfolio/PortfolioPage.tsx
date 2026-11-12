"use client";

import { useQuery } from "@tanstack/react-query";
import { FileDown, NotebookPen } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { PageTitle } from "@/components/mobile/PageTitle";
import { SettingSwitch } from "@/components/Notifications/SettingSwitch";
import { PortfolioDocument } from "@/components/Portfolio/PortfolioDocument";
import type { TPortfolio } from "@/interfaces/Engagement";
import { ApiError, apiRequest } from "@/modules/api/client";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
import "./print.css";

// /portfolio (學習歷程, design/api-contract-v4.md §3.1): your own posts,
// SIGs and teacher feedback as one document. Pick the posts (all by
// default) and whether to include 老師回饋, then 「下載 PDF」 prints it
// (the browser's 「另存為 PDF」) with the A4 layout in print.css.

function isPortfolio(value: unknown): value is TPortfolio {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as TPortfolio).posts) &&
    typeof (value as TPortfolio).user === "object"
  );
}

async function fetchPortfolio(signal: AbortSignal): Promise<TPortfolio> {
  const result = await apiRequest<TPortfolio>("/user/me/portfolio", {
    auth: true,
    signal,
  });
  if (!result.ok) {
    throw new ApiError(result);
  }
  if (!isPortfolio(result.data)) {
    throw new ApiError({
      ok: false,
      kind: "invalid-response",
      status: result.status,
      httpStatus: result.httpStatus,
      message: "伺服器暫時無法回應，請稍後再試",
      body: result.body,
    });
  }
  return {
    ...result.data,
    sigs: Array.isArray(result.data.sigs) ? result.data.sigs : [],
    posts: result.data.posts.map((post) => ({
      ...post,
      likes: post.likes ?? 0,
      comments: post.comments ?? 0,
      views: post.views ?? 0,
      sig: post.sig ?? { _id: "", name: "" },
      feedback: Array.isArray(post.feedback) ? post.feedback : [],
    })),
  };
}

const secondaryClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control bg-brand-700 px-4 font-semibold text-sm text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50";

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card">
      {children}
    </div>
  );
}

export default function PortfolioPage() {
  const isMobile = useIsMobile();
  const { isLogin, isLoading, userData, login } = useUserAccount();
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [includeFeedback, setIncludeFeedback] = useState(true);

  const portfolio = useQuery<TPortfolio, Error>({
    queryKey: ["portfolio", userData?._id ?? ""],
    queryFn: ({ signal }) => fetchPortfolio(signal),
    enabled: isLogin && !isLoading,
    staleTime: 60 * 1000,
  });
  const data = portfolio.data;

  // Every post is in by default, also after a refetch adds new ones.
  useEffect(() => {
    if (data) {
      setSelected((previous) => {
        const ids = data.posts.map((post) => post._id);
        if (!previous) {
          return new Set(ids);
        }
        const kept = new Set(ids.filter((id) => previous.has(id)));
        return kept;
      });
    }
  }, [data]);

  const chosen = selected ?? new Set<string>();
  const total = data?.posts.length ?? 0;
  const hasFeedback = Boolean(
    data?.posts.some((post) => post.feedback.length > 0),
  );

  const toggle = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous ?? []);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const height = isMobile ? "h-10" : "h-9";

  let content: ReactNode;
  if (isLoading || (isLogin && portfolio.isPending)) {
    content = (
      <div
        aria-hidden
        className="h-[32rem] animate-pulse rounded-card border border-line bg-surface"
      />
    );
  } else if (!isLogin) {
    content = (
      <Notice>
        <NotebookPen size={28} className="text-ink-400" aria-hidden />
        <p className="text-ink-700">
          登入後就能把你的貼文、SIG 經歷和老師回饋整理成學習歷程。
        </p>
        <button
          type="button"
          className={`${primaryClass} h-10 px-6`}
          onClick={() => login()}
        >
          登入
        </button>
      </Notice>
    );
  } else if (portfolio.isError || !data) {
    content = (
      <Notice>
        <p role="alert" className="text-ink-700">
          {portfolio.error?.message ?? "伺服器暫時無法回應，請稍後再試"}
        </p>
        <button
          type="button"
          className={`${secondaryClass} h-9`}
          onClick={() => void portfolio.refetch()}
        >
          重試
        </button>
      </Notice>
    );
  } else {
    content = (
      <>
        <div
          data-print-hide
          className="flex flex-col gap-3 rounded-card border border-line bg-surface px-5 py-4 shadow-card"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-auto text-ink-700 text-sm" aria-live="polite">
              已選 <b className="text-ink-900">{chosen.size}</b> / {total}{" "}
              篇貼文
            </p>
            <button
              type="button"
              className={`${secondaryClass} ${height}`}
              disabled={total === 0 || chosen.size === total}
              onClick={() =>
                setSelected(new Set(data.posts.map((post) => post._id)))
              }
            >
              全選
            </button>
            <button
              type="button"
              className={`${secondaryClass} ${height}`}
              disabled={chosen.size === 0}
              onClick={() => setSelected(new Set())}
            >
              全不選
            </button>
          </div>
          <div className="border-line border-t">
            <SettingSwitch
              label="包含老師回饋"
              hint={
                hasFeedback
                  ? "把指導老師給你的回饋一起放進文件"
                  : "你的貼文目前還沒有老師回饋"
              }
              checked={includeFeedback}
              mobile={isMobile}
              onChange={setIncludeFeedback}
            />
          </div>
        </div>
        <PortfolioDocument
          portfolio={data}
          selected={chosen}
          includeFeedback={includeFeedback}
          onToggle={toggle}
          variant={isMobile ? "mobile" : "desktop"}
        />
      </>
    );
  }

  const printButton = (
    <button
      type="button"
      data-print-hide
      className={`${primaryClass} ${height}`}
      disabled={!data}
      onClick={() => window.print()}
    >
      <FileDown size={16} aria-hidden />
      下載 PDF
    </button>
  );

  if (isMobile) {
    return (
      <div
        data-portfolio
        className="flex h-dvh flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]"
      >
        <div data-print-hide className="shrink-0">
          <PageTitle title="學習歷程" />
        </div>
        <div
          data-print-scroll
          className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-4"
        >
          {data && (
            <div
              data-print-hide
              className="flex items-center justify-between gap-2 px-1"
            >
              <p className="text-ink-500 text-xs">在列印視窗選「另存為 PDF」</p>
              {printButton}
            </div>
          )}
          {content}
        </div>
      </div>
    );
  }

  return (
    <main
      data-portfolio
      className="layout-doc mx-auto flex h-full min-h-0 w-[min(56rem,100%-4rem)] flex-col gap-4"
    >
      <header
        data-print-hide
        className="flex shrink-0 items-center gap-4 rounded-card border border-line bg-surface px-6 py-5 shadow-card"
      >
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-2xl text-ink-900 leading-[1.4] tracking-[0.01em]">
            學習歷程
          </h1>
          <p className="mt-1 text-ink-500 text-sm">
            選好要收錄的貼文，按「下載 PDF」後在列印視窗選「另存為 PDF」
          </p>
        </div>
        {printButton}
      </header>
      <div
        data-print-scroll
        className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2"
      >
        {content}
      </div>
    </main>
  );
}

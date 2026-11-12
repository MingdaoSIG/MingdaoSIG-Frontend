"use client";

import { useQuery } from "@tanstack/react-query";
import { FileDown, NotebookPen } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { PageTitle } from "@/components/mobile/PageTitle";
import { PortfolioChecklist } from "@/components/Portfolio/PortfolioChecklist";
import {
  PortfolioDocument,
  type PortfolioSections,
} from "@/components/Portfolio/PortfolioDocument";
import type { TPortfolio } from "@/interfaces/Engagement";
import { ApiError, apiRequest } from "@/modules/api/client";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
import "./print.css";

// /portfolio (學習歷程, design/api-contract-v4.md §3.1, design v3 7B):
// your own posts, SIGs and teacher feedback as one document. Left, a
// checklist of what goes in (基本資料, SIG 與幹部經歷, 文章 one by one,
// 老師回饋, 數據; everything by default); right, a live A4 preview. On
// phones the two are tabs. 「下載 PDF」 prints it (the browser's 「另存為
// PDF」) with the A4 layout in print.css.

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

/** 210 mm at 96 dpi: the width of an A4 sheet on screen. */
const A4_WIDTH_PX = 794;

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card">
      {children}
    </div>
  );
}

/** Scales the A4 sheets down to fit their column (never up). */
function useFitScale(padding: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const measure = () => {
      const width = el.clientWidth - padding * 2;
      setScale(Math.min(1, Math.max(0.3, width / A4_WIDTH_PX)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [padding]);
  return { ref, scale };
}

export default function PortfolioPage() {
  const isMobile = useIsMobile();
  const { isLogin, isLoading, userData, login } = useUserAccount();
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [includeFeedback, setIncludeFeedback] = useState(true);
  const [sections, setSections] = useState<PortfolioSections>({
    profile: true,
    sigs: true,
    stats: true,
  });
  const [tab, setTab] = useState<"content" | "preview">("content");
  const fit = useFitScale(isMobile ? 8 : 24);

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
  const height = isMobile ? "h-11" : "h-10";

  const printButton = (
    <button
      type="button"
      data-print-hide
      className={`${primaryClass} ${height} ${isMobile ? "" : "w-full"}`}
      disabled={!data}
      onClick={() => window.print()}
    >
      <FileDown size={16} aria-hidden />
      下載 PDF
    </button>
  );

  let notice: ReactNode = null;
  if (isLoading || (isLogin && portfolio.isPending)) {
    notice = (
      <div
        aria-hidden
        className="h-[32rem] animate-pulse rounded-card border border-line bg-surface"
      />
    );
  } else if (!isLogin) {
    notice = (
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
    notice = (
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
  }

  const checklist = data && (
    <PortfolioChecklist
      portfolio={data}
      sections={sections}
      onSections={setSections}
      selected={chosen}
      onSelected={setSelected}
      includeFeedback={includeFeedback}
      onIncludeFeedback={setIncludeFeedback}
      mobile={isMobile}
    />
  );

  // The sheets keep their A4 size and are scaled to the column; print.css
  // resets the zoom.
  const sheets = data && (
    <div data-a4-zoom style={{ zoom: fit.scale }}>
      <PortfolioDocument
        portfolio={data}
        selected={chosen}
        includeFeedback={includeFeedback}
        sections={sections}
        variant="a4"
      />
    </div>
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
        {data && (
          <div
            data-print-hide
            className="flex shrink-0 items-center gap-2 px-0.5"
          >
            <div
              role="tablist"
              aria-label="學習歷程"
              className="flex flex-1 rounded-control bg-ink-900/6 p-1"
            >
              {(
                [
                  ["content", "選擇內容"],
                  ["preview", "預覽"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value)}
                  className={`h-9 flex-1 cursor-pointer rounded-[6px] font-semibold text-sm ${
                    tab === value
                      ? "bg-surface text-ink-900 shadow-card"
                      : "text-ink-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {printButton}
          </div>
        )}
        <div
          data-print-scroll
          className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-4"
        >
          {notice}
          {data && (
            <>
              <div
                data-print-hide
                hidden={tab !== "content"}
                className="rounded-card border border-line bg-surface p-3 shadow-card"
              >
                {checklist}
                <p className="mt-2 px-2 text-ink-500 text-xs">
                  按「下載 PDF」後，在列印視窗選「另存為 PDF」。
                </p>
              </div>
              <div
                ref={fit.ref}
                data-print-scroll
                data-print-show
                className={`rounded-card bg-ink-900/8 py-3 ${
                  tab === "preview" ? "" : "hidden"
                }`}
              >
                {sheets}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <main
      data-portfolio
      className="layout-doc mx-auto grid h-full min-h-0 w-[min(80rem,100%-4rem)] grid-cols-[20rem_minmax(0,1fr)] gap-6"
    >
      <aside
        data-print-hide
        aria-label="收錄內容"
        className="custom-scrollbar flex min-h-0 flex-col gap-4 overflow-y-auto rounded-card border border-line bg-surface p-4 shadow-card"
      >
        <header className="px-2">
          <h1 className="font-bold text-2xl text-ink-900 leading-[1.4] tracking-[0.01em]">
            學習歷程
          </h1>
          <p className="mt-1 text-ink-500 text-sm leading-6">
            勾選要收錄的內容，右邊是印出來的樣子。按「下載
            PDF」後在列印視窗選「另存為 PDF」。
          </p>
        </header>
        {notice ? null : checklist}
        <div className="mt-auto px-2 pt-2">{printButton}</div>
      </aside>
      <div
        ref={fit.ref}
        data-print-scroll
        className="custom-scrollbar min-h-0 overflow-y-auto rounded-card bg-ink-900/8 py-6"
      >
        {notice ? <div className="px-6">{notice}</div> : sheets}
      </div>
    </main>
  );
}

import Link from "next/link";

/** 「學習歷程」 row on your own profile: the way to /portfolio. */
export function PortfolioEntry({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p
          className={`font-semibold text-ink-800 ${
            mobile ? "text-sm" : "text-[0.9rem]"
          }`}
        >
          學習歷程
        </p>
        <p className="text-ink-500 text-xs leading-5">
          <span className="whitespace-nowrap">貼文、SIG 經歷與老師回饋</span>
          {"・"}
          <span className="whitespace-nowrap">可下載 PDF</span>
        </p>
      </div>
      <Link
        href="/portfolio"
        className={`inline-flex shrink-0 items-center rounded-control border border-line-strong bg-surface px-3.5 font-semibold text-brand-700 text-sm transition-colors hover:bg-field ${
          mobile ? "h-11" : "h-9"
        }`}
      >
        查看
      </Link>
    </div>
  );
}

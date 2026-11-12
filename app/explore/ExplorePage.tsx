"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { DocPage } from "@/components/desktop/DocPage";
import { PageTitle } from "@/components/mobile/PageTitle";
import { TopTags } from "@/components/Tags/TopTags";
import { SEARCH_MAX_LENGTH, searchHref } from "@/modules/search";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import { ANNOUNCEMENT_SIG_ID, useSigDirectory } from "@/utils/useAdminAccess";
import useIsMobile from "@/utils/useIsMobile";

// 探索 (v3 1B): search, then 熱門標籤 and every SIG. The SIG tiles moved
// here from the home page's right column.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="shrink-0 rounded-card border border-line bg-surface p-4 shadow-card lg:p-5">
      <h2 className="mb-3 font-bold text-base text-ink-900">{title}</h2>
      {children}
    </section>
  );
}

function SearchBox() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(searchHref(value));
  }

  return (
    <search className="w-full shrink-0">
      <form onSubmit={onSubmit} className="flex w-full gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-control border border-line-strong bg-surface px-3 shadow-card focus-within:border-brand-700/50 focus-within:ring-2 focus-within:ring-brand-700/20">
          <Search size={18} className="shrink-0 text-ink-500" aria-hidden />
          <span className="sr-only">搜尋</span>
          <input
            type="search"
            enterKeyHint="search"
            value={value}
            maxLength={SEARCH_MAX_LENGTH}
            onChange={(event) => setValue(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-base text-ink-900 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="h-11 shrink-0 cursor-pointer rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
        >
          搜尋
        </button>
      </form>
    </search>
  );
}

function SigGrid() {
  const directory = useSigDirectory();
  const sigs = (directory.data ?? []).filter(
    (sig) => sig._id !== ANNOUNCEMENT_SIG_ID && sig.customId,
  );

  if (directory.isPending) {
    return (
      <div aria-hidden className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {["a", "b", "c", "d"].map((key) => (
          <div
            key={key}
            className="h-20 animate-pulse rounded-control bg-field"
          />
        ))}
      </div>
    );
  }
  if (directory.isError) {
    return (
      <p role="alert" className="text-ink-500 text-sm">
        SIG 列表載入失敗。
        <button
          type="button"
          className="cursor-pointer font-semibold text-brand-700 hover:underline"
          onClick={() => void directory.refetch()}
        >
          重試
        </button>
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {sigs.map((sig) => (
        <li key={sig._id}>
          <Link
            href={`/@${sig.customId}`}
            title={sig.name}
            className="flex h-full min-h-20 flex-col justify-center gap-1 rounded-control border border-line border-t-[3px] border-t-[var(--sig-color)] bg-surface px-3 py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--sig-color)_6%,white)]"
            style={{
              ["--sig-color" as string]: resolveSigColor(sig) ?? BRAND_COLOR,
            }}
          >
            <span className="sig-text line-clamp-2 font-semibold text-[0.95rem] leading-snug [overflow-wrap:anywhere]">
              {sig.name}
            </span>
            {typeof sig.memberCount === "number" && (
              <span className="text-ink-500 text-xs">
                {sig.memberCount} 位成員
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Content() {
  return (
    <>
      <SearchBox />
      <Section title="熱門標籤">
        <TopTags limit={16} />
      </Section>
      <Section title="全部 SIG">
        <SigGrid />
      </Section>
    </>
  );
}

export default function ExplorePage() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <PageTitle title="探索" />
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
          <Content />
        </div>
      </div>
    );
  }

  return (
    <DocPage title="探索" width="narrow">
      <div className="flex flex-col gap-4 pb-2">
        <Content />
      </div>
    </DocPage>
  );
}

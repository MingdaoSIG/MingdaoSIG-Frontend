"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FaqAccordion } from "@/components/Help/FaqAccordion";
import { Highlighted } from "@/components/Help/HelpSearch";
import { USER_FAQ } from "@/modules/help/faq";
import { searchTerms } from "@/modules/help/search";
import { plainHelpText } from "@/modules/help/text";
import { HelpCard, HelpPage } from "../HelpPage";

// 常見問題: grouped accordions with a filter. Each question has its own
// link (`/about/faq#q-<id>`), which opens it.

export function FaqPage() {
  const [query, setQuery] = useState("");
  const terms = useMemo(() => searchTerms(query), [query]);
  const groups = useMemo(() => {
    if (terms.length === 0) {
      return USER_FAQ;
    }
    return USER_FAQ.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const text =
          `${item.q} ${item.a.map(plainHelpText).join(" ")}`.toLowerCase();
        return terms.every((term) => text.includes(term));
      }),
    })).filter((group) => group.items.length > 0);
  }, [terms]);
  const count = groups.reduce((n, group) => n + group.items.length, 0);

  return (
    <HelpPage title="常見問題" description="點問題就會展開答案。">
      <div className="rounded-card border border-line bg-surface p-3 shadow-card">
        <div className="flex h-10 items-center gap-2 rounded-control border border-line-strong px-3 focus-within:border-brand-700">
          <Search aria-hidden className="size-4 shrink-0 text-ink-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="篩選常見問題"
            placeholder="篩選常見問題"
            data-faq-filter
            className="min-w-0 flex-1 bg-transparent text-ink-900 text-sm outline-none placeholder:text-ink-400 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="清除篩選"
              className="-mr-1 flex size-7 cursor-pointer items-center justify-center rounded-control text-ink-500 hover:bg-field"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </div>
        {terms.length > 0 && (
          <p aria-live="polite" className="mt-2 px-1 text-ink-500 text-xs">
            {count > 0 ? `${count} 個問題` : "沒有符合的問題，可以換個說法。"}
          </p>
        )}
      </div>
      {groups.map((group) => (
        <HelpCard key={group.id} title={group.title} id={`g-${group.id}`}>
          <FaqAccordion
            items={group.items}
            anchorPrefix="q-"
            renderQuestion={
              terms.length > 0
                ? (item) => <Highlighted text={item.q} terms={terms} />
                : undefined
            }
          />
        </HelpCard>
      ))}
    </HelpPage>
  );
}

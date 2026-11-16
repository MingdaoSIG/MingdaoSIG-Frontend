"use client";

import { ArrowRight, Clock, MousePointerClick } from "lucide-react";
import Link from "next/link";
import { FaqAccordion } from "@/components/Help/FaqAccordion";
import { HelpSearch } from "@/components/Help/HelpSearch";
import { ReportStrip } from "@/components/Help/ReportStrip";
import { FAQ_HIGHLIGHTS, userFaqItems } from "@/modules/help/faq";
import { GUIDE_TOPICS, QUICK_TOPICS } from "@/modules/help/guide";
import { HELP_SECTIONS } from "@/modules/help/sections";
import { HelpCard } from "./HelpPage";

// 開始使用 (/about): the hero with the search, the most used tutorials,
// the FAQ highlights, the report strip and the other sections.

const MORE = ["rules", "changelog", "stats", "status", "contact"];

export function StartPage() {
  const topics = QUICK_TOPICS.flatMap((id) =>
    GUIDE_TOPICS.filter((topic) => topic.id === id),
  );
  const faq = userFaqItems(FAQ_HIGHLIGHTS);
  return (
    <article className="flex w-full min-w-0 flex-col gap-4 lg:max-w-[52rem]">
      <header className="rounded-card border border-line bg-surface px-4 py-5 shadow-card lg:px-8 lg:py-8">
        <p className="font-semibold text-brand-700 text-sm">
          明道中學 SIG 平台
        </p>
        <h1 className="mt-1 font-bold text-2xl text-ink-900 leading-[1.4] lg:text-[1.75rem]">
          MDSIG 說明中心
        </h1>
        <p className="mt-1 text-ink-700 text-sm leading-6 lg:text-[0.9375rem]">
          搜尋教學、常見問題，或直接回報問題
        </p>
        <div className="mt-4">
          <HelpSearch variant="hero" />
        </div>
      </header>

      <HelpCard
        title="常用教學"
        id="quick"
        action={
          <Link
            href="/about/guide"
            className="flex items-center gap-1 font-semibold text-brand-700 text-sm hover:underline"
          >
            全部教學
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        }
      >
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.id} className="min-w-0">
              <Link
                href={`/about/guide/${topic.id}`}
                data-help-topic={topic.id}
                className="flex h-full flex-col gap-1 rounded-control border border-line px-4 py-3 transition-colors hover:border-brand-700/40 hover:bg-brand-50/50"
              >
                <span className="font-bold text-[0.9375rem] text-ink-900">
                  {topic.title}
                </span>
                <span className="text-ink-500 text-sm leading-6">
                  {topic.summary}
                </span>
                <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-ink-500 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock aria-hidden className="size-3.5" />約 {topic.minutes}{" "}
                    分鐘
                  </span>
                  {topic.tour && (
                    <span className="flex items-center gap-1 text-brand-700">
                      <MousePointerClick aria-hidden className="size-3.5" />
                      可以帶你走一遍
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </HelpCard>

      <HelpCard
        title="常見問題"
        id="faq-highlights"
        action={
          <Link
            href="/about/faq"
            className="flex items-center gap-1 font-semibold text-brand-700 text-sm hover:underline"
          >
            全部問題
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        }
      >
        <FaqAccordion items={faq} />
      </HelpCard>

      {/* Phones get the strip at the end of every page (HelpShell). */}
      <div className="hidden lg:block">
        <ReportStrip />
      </div>

      <HelpCard title="更多資訊" id="more">
        <ul className="flex flex-wrap gap-2">
          {HELP_SECTIONS.filter((section) => MORE.includes(section.id)).map(
            (section) => (
              <li key={section.id}>
                <Link
                  href={section.href}
                  className="flex h-9 items-center rounded-control border border-line-strong px-3 font-semibold text-ink-700 text-sm hover:bg-field"
                >
                  {section.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      </HelpCard>
    </article>
  );
}

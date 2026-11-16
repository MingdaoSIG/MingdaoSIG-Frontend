import { ArrowLeft, ArrowRight, Clock, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqAccordion } from "@/components/Help/FaqAccordion";
import { GuideSteps } from "@/components/Help/GuideSteps";
import { HelpText } from "@/components/Help/HelpText";
import { TourButton } from "@/components/HelpTour/TourButton";
import { userFaqItems } from "@/modules/help/faq";
import { GUIDE_TOPICS, guideTopic } from "@/modules/help/guide";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import { HelpCard, HelpPage } from "../../HelpPage";

// One tutorial (decision 2C): numbered steps with screenshots, the tips,
// the related questions, 「在網站上帶我走一遍」 for the three toured
// flows, and the previous / next topic.

export function generateStaticParams() {
  return GUIDE_TOPICS.map((topic) => ({ topic: topic.id }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = guideTopic((await params).topic);
  return topic
    ? {
        title: `${topic.title}・使用教學${SITE_TITLE_SUFFIX}`,
        description: topic.summary,
      }
    : {};
}

export default async function GuideTopicPage({ params }: Props) {
  const topic = guideTopic((await params).topic);
  if (!topic) {
    notFound();
  }
  const siblings = GUIDE_TOPICS.filter(
    (item) => item.audience === topic.audience,
  );
  const at = siblings.findIndex((item) => item.id === topic.id);
  const previous = at > 0 ? siblings[at - 1] : null;
  const next = at < siblings.length - 1 ? siblings[at + 1] : null;
  const faq = userFaqItems(topic.faq ?? []);

  return (
    <HelpPage
      title={topic.title}
      description={
        <>
          <Link href="/about/guide" className="hover:text-brand-700">
            使用教學
          </Link>
          {topic.audience === "managers" ? "・SIG 幹部與指導老師" : ""}
          <span aria-hidden> · </span>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden className="size-3.5" />約 {topic.minutes} 分鐘
          </span>
          <span className="mt-1 block text-ink-700">{topic.summary}</span>
        </>
      }
      actions={topic.tour ? <TourButton tour={topic.tour} /> : undefined}
    >
      <HelpCard title="步驟" id="steps">
        <GuideSteps steps={topic.steps} idPrefix="step-" />
      </HelpCard>
      {topic.tips && topic.tips.length > 0 && (
        <HelpCard title="小提醒" id="tips">
          <ul className="flex flex-col gap-2">
            {topic.tips.map((tip) => (
              <li
                key={tip}
                className="flex gap-2 text-[0.9375rem] text-ink-700 leading-[1.75]"
              >
                <Lightbulb
                  aria-hidden
                  className="mt-1 size-4 shrink-0 text-warm-600"
                />
                <span>
                  <HelpText text={tip} />
                </span>
              </li>
            ))}
          </ul>
        </HelpCard>
      )}
      {faq.length > 0 && (
        <HelpCard title="相關問題" id="related">
          <FaqAccordion items={faq} />
        </HelpCard>
      )}
      <nav
        aria-label="其他教學"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {previous ? (
          <Link
            href={`/about/guide/${previous.id}`}
            className="flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-3 shadow-card hover:bg-field"
          >
            <ArrowLeft aria-hidden className="size-4 shrink-0 text-ink-400" />
            <span className="min-w-0">
              <span className="block text-ink-500 text-xs">上一篇</span>
              <span className="block truncate font-semibold text-ink-900 text-sm">
                {previous.title}
              </span>
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next && (
          <Link
            href={`/about/guide/${next.id}`}
            className="flex items-center justify-end gap-2 rounded-card border border-line bg-surface px-4 py-3 text-right shadow-card hover:bg-field"
          >
            <span className="min-w-0">
              <span className="block text-ink-500 text-xs">下一篇</span>
              <span className="block truncate font-semibold text-ink-900 text-sm">
                {next.title}
              </span>
            </span>
            <ArrowRight aria-hidden className="size-4 shrink-0 text-ink-400" />
          </Link>
        )}
      </nav>
    </HelpPage>
  );
}

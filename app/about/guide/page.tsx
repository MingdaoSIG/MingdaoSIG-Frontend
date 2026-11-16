import { Clock, MousePointerClick } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { GUIDE_TOPICS } from "@/modules/help/guide";
import type { GuideAudience } from "@/modules/help/types";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import { HelpCard, HelpPage } from "../HelpPage";

export const metadata: Metadata = {
  title: `使用教學${SITE_TITLE_SUFFIX}`,
  description: "MDSIG 使用教學：發文、加入 SIG、活動報名、通知與學習歷程。",
};

const GROUPS: { audience: GuideAudience; title: string; id: string }[] = [
  { audience: "everyone", title: "給所有人", id: "everyone" },
  { audience: "managers", title: "給 SIG 幹部與指導老師", id: "managers" },
];

export default function GuideIndexPage() {
  return (
    <HelpPage
      title="使用教學"
      description="一步一步的圖文教學。標示「可以帶你走一遍」的，還能在網站上實際操作一次。"
    >
      {GROUPS.map((group) => (
        <HelpCard key={group.id} title={group.title} id={group.id}>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {GUIDE_TOPICS.filter(
              (topic) => topic.audience === group.audience,
            ).map((topic) => (
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
                      <Clock aria-hidden className="size-3.5" />約{" "}
                      {topic.minutes} 分鐘・{topic.steps.length} 個步驟
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
      ))}
    </HelpPage>
  );
}

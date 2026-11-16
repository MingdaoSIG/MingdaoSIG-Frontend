import { ArrowRight, BookOpen, Info, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import { HelpCard, HelpPage } from "../HelpPage";

export const metadata: Metadata = {
  title: `平台規範${SITE_TITLE_SUFFIX}`,
  description: "MDSIG 平台規範、關於 MDSIG 與 Markdown 教學。",
};

// 平台規範: the three posts the platform keeps its rules and background in.

const POSTS = [
  {
    href: "/post/652cabdb45c0be8f82c54d9a",
    title: "平台規範",
    text: "在 MDSIG 發文、留言和使用 SIG 要遵守的規則。",
    icon: ScrollText,
  },
  {
    href: "/post/65325fce0b891d1f6b5b3131",
    title: "關於 MDSIG",
    text: "MDSIG 是什麼、為什麼做，以及開發團隊。",
    icon: Info,
  },
  {
    href: "/post/652e4591d04b679afdff697e",
    title: "Markdown 教學",
    text: "發文用的 Markdown 語法：標題、清單、連結、圖片、表格與程式碼。",
    icon: BookOpen,
  },
];

export default function RulesPage() {
  return (
    <HelpPage title="平台規範" description="使用 MDSIG 前請先讀過平台規範。">
      <HelpCard>
        <ul className="flex flex-col gap-3">
          {POSTS.map((post) => {
            const Icon = post.icon;
            return (
              <li key={post.href}>
                <Link
                  href={post.href}
                  data-rules-link={post.title}
                  className="flex items-center gap-3 rounded-control border border-line px-4 py-3 transition-colors hover:border-brand-700/40 hover:bg-brand-50/50"
                >
                  <Icon
                    aria-hidden
                    className="size-5 shrink-0 text-brand-700"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[0.9375rem] text-ink-900">
                      {post.title}
                    </span>
                    <span className="block text-ink-500 text-sm leading-6">
                      {post.text}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="size-4 shrink-0 text-ink-400"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </HelpCard>
    </HelpPage>
  );
}

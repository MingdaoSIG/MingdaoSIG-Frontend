// The sections of the help centre at /about (decision 1B), in table of
// contents order. Each has its own URL.

export type HelpSectionId =
  | "start"
  | "guide"
  | "faq"
  | "report"
  | "rules"
  | "changelog"
  | "stats"
  | "status"
  | "contact";

export type HelpSection = {
  id: HelpSectionId;
  label: string;
  href: string;
  /** Words people search with, besides the label. */
  keywords: string;
};

export const HELP_SECTIONS: HelpSection[] = [
  { id: "start", label: "開始使用", href: "/about", keywords: "說明中心 首頁" },
  {
    id: "guide",
    label: "使用教學",
    href: "/about/guide",
    keywords: "教學 怎麼用 步驟",
  },
  { id: "faq", label: "常見問題", href: "/about/faq", keywords: "問題 FAQ" },
  {
    id: "report",
    label: "回報問題",
    href: "/about/report",
    keywords: "回報 錯誤 建議 帳號問題 bug",
  },
  {
    id: "rules",
    label: "平台規範",
    href: "/about/rules",
    keywords: "規範 規則 關於 MDSIG Markdown 教學",
  },
  {
    id: "changelog",
    label: "更新紀錄",
    href: "/about/changelog",
    keywords: "版本 更新 新功能 修復",
  },
  {
    id: "stats",
    label: "平台數據",
    href: "/about/stats",
    keywords: "數據 統計 使用者 貼文 dashboard",
  },
  {
    id: "status",
    label: "運行狀態",
    href: "/about/status",
    keywords: "狀態 版本 運行時間 當機 status",
  },
  {
    id: "contact",
    label: "聯絡與加入我們",
    href: "/about/contact",
    keywords: "聯絡 電子郵件 Instagram 加入開發團隊",
  },
];

/** The section a path under /about belongs to. */
export function helpSectionFor(pathname: string): HelpSection {
  const match = HELP_SECTIONS.slice(1).find(
    (section) =>
      pathname === section.href || pathname.startsWith(`${section.href}/`),
  );
  return match ?? HELP_SECTIONS[0];
}

/**
 * The anchors of the old one-page 關於 MDSIG (`/about#…`) and where they
 * live now. `#info` held the links (平台規範, 關於 MDSIG, Markdown 教學).
 */
export const OLD_ABOUT_ANCHORS: Record<string, string> = {
  info: "/about/rules",
  links: "/about/rules",
  rules: "/about/rules",
  dashboard: "/about/stats",
  stats: "/about/stats",
  changelog: "/about/changelog",
  status: "/about/status",
  contact: "/about/contact",
  guide: "/about/guide",
  faq: "/about/faq",
  report: "/about/report",
};

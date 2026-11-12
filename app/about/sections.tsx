"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import changelog from "@/app/changelog/(Changelog)/config/changelog.json";
import links from "./config/links.json";

// The parts of 關於 MDSIG that used to be pages of their own: 資訊 (the
// links), 更新紀錄, 運行狀態 and 聯絡. 平台數據 is ./dashboard (chart.js,
// loaded on demand).

export const docLink =
  "text-brand-700 underline decoration-brand-700/30 underline-offset-[0.2em] transition-colors hover:text-brand-800 hover:decoration-current";

const CONTACT_GROUP = "聯絡我們";

function LinkList({ items }: { items: { name: string; url: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((child) => {
        const external = /^(https?:|mailto:)/.test(child.url);
        return (
          <li key={child.name}>
            <Link
              href={child.url}
              target={
                external && !child.url.startsWith("mailto:")
                  ? "_blank"
                  : undefined
              }
              rel={external ? "noopener noreferrer" : undefined}
              className={docLink}
            >
              {child.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** 常用連結, 回報錯誤, 常用資料, 小小彩蛋. */
export function InfoLinks() {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
      {links
        .filter((group) => group.name !== CONTACT_GROUP)
        .map((group) => (
          <div key={group.name}>
            <h3 className="mb-2 font-bold text-base text-ink-900">
              {group.name}
            </h3>
            <LinkList items={group.children} />
          </div>
        ))}
    </div>
  );
}

/** 聯絡我們. */
export function ContactLinks() {
  const group = links.find((item) => item.name === CONTACT_GROUP);
  return group ? <LinkList items={group.children} /> : null;
}

// ---- 運行狀態 -----------------------------------------------------------

interface PingEndpoint {
  currentVersion?: string;
  uptime?: string;
}

interface PingData {
  frontend?: PingEndpoint;
  backend?: PingEndpoint;
}

function parseUptime(uptime: string | undefined): number {
  if (!uptime || uptime === "N/A") {
    return 0;
  }
  const units: [RegExp, number][] = [
    [/(\d+)\s*month/, 30 * 24 * 3600 * 1000],
    [/(\d+)\s*day/, 24 * 3600 * 1000],
    [/(\d+)\s*hour/, 3600 * 1000],
    [/(\d+)\s*minute/, 60 * 1000],
    [/(\d+)\s*second/, 1000],
  ];
  let total = 0;
  for (const [pattern, ms] of units) {
    const match = uptime.match(pattern);
    if (match) {
      total += Number.parseInt(match[1], 10) * ms;
    }
  }
  return total;
}

function formatUptime(ms: number): string {
  if (ms <= 0) {
    return "未知";
  }
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 60000) % 60);
  const hours = Math.floor((ms / 3600000) % 24);
  const days = Math.floor((ms / 86400000) % 30);
  const months = Math.floor(ms / (86400000 * 30));
  const parts: string[] = [];
  if (months > 0) {
    parts.push(`${months} 月`);
  }
  if (days > 0) {
    parts.push(`${days} 天`);
  }
  if (hours > 0) {
    parts.push(`${hours} 時`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} 分`);
  }
  parts.push(`${seconds} 秒`);
  return parts.join(" ");
}

const BADGES = [
  {
    label: "前端",
    href: "https://sig.mingdao.edu.tw/ping",
    src: "https://status.sig.school/api/badge/1/uptime?labelPrefix=前端+&style=for-the-badge",
  },
  {
    label: "後端",
    href: "https://sig-api.mingdao.edu.tw/ping",
    src: "https://status.sig.school/api/badge/8/uptime?labelPrefix=後端+&style=for-the-badge",
  },
  {
    label: "資料庫",
    href: undefined,
    src: "https://status.sig.school/api/badge/6/uptime?labelPrefix=資料庫+&style=for-the-badge",
  },
];

/** Versions, uptime (ticking) and the status badges. */
export function StatusPanel() {
  const [ping, setPing] = useState<PingData | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const started = useRef<{ frontend: number; backend: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/ping", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: PingData) => {
        const at = Date.now();
        started.current = {
          frontend: at - parseUptime(data?.frontend?.uptime),
          backend: at - parseUptime(data?.backend?.uptime),
        };
        setPing(data ?? {});
      })
      .catch(() => {
        setPing({});
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!ping) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [ping]);

  const uptime = (key: "frontend" | "backend") => {
    if (!ping) {
      return "載入中…";
    }
    const start = started.current?.[key] ?? 0;
    const value = ping[key]?.uptime;
    return value && start ? formatUptime(now - start) : "未知";
  };
  const version = (key: "frontend" | "backend") => {
    const value = ping?.[key]?.currentVersion;
    if (value && value !== "N/A") {
      return `v${value}`;
    }
    return ping ? "未知" : "載入中…";
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))]">
      <dl className="grid grid-cols-[auto_1fr] content-start gap-x-4 gap-y-2 text-sm">
        <dt className="text-ink-500">前端版本</dt>
        <dd className="text-ink-900">{version("frontend")}</dd>
        <dt className="text-ink-500">後端版本</dt>
        <dd className="text-ink-900">{version("backend")}</dd>
        <dt className="text-ink-500">前端運行時間</dt>
        <dd className="text-ink-900 tabular-nums">{uptime("frontend")}</dd>
        <dt className="text-ink-500">後端運行時間</dt>
        <dd className="text-ink-900 tabular-nums">{uptime("backend")}</dd>
      </dl>
      <div className="space-y-3">
        {BADGES.map((badge) => (
          <div key={badge.label}>
            <p className="mb-1.5 text-ink-700 text-sm">
              {badge.href ? (
                <Link
                  href={badge.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={docLink}
                >
                  {badge.label}
                </Link>
              ) : (
                badge.label
              )}
            </p>
            <Image
              src={badge.src}
              alt={`${badge.label}運行狀態`}
              width={208}
              height={28}
              className="h-auto w-full max-w-[13rem]"
              unoptimized
            />
          </div>
        ))}
        <p className="pt-1 text-ink-700 text-sm">
          <Link
            href="https://status.sig.school/"
            target="_blank"
            rel="noopener noreferrer"
            className={docLink}
          >
            前往狀態頁面查看詳細資訊
          </Link>
        </p>
      </div>
    </div>
  );
}

// ---- 更新紀錄 -----------------------------------------------------------

type ChangeType = "feature" | "improvement" | "fix" | "security";

type ChangelogEntry = {
  version: string;
  date: string;
  type: ChangeType;
  title: string;
  summary: string;
  changes: { type: ChangeType; description: string }[];
};

// Muted semantic colours: readable text on a light tint (AA on white).
const TYPE_LABELS: Record<
  ChangeType,
  { text: string; fg: string; bg: string }
> = {
  feature: { text: "新功能", fg: "#1d6b46", bg: "#e6f3ec" },
  improvement: { text: "優化", fg: "#0b5a83", bg: "#e5edf3" },
  fix: { text: "修復", fg: "#85530a", bg: "#f8efdc" },
  security: { text: "安全性", fg: "#b42318", bg: "#fbeceb" },
};

function TypeTag({ type }: { type: ChangeType }) {
  const label = TYPE_LABELS[type] ?? TYPE_LABELS.improvement;
  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-chip px-2 py-0.5 font-semibold text-xs"
      style={{ color: label.fg, backgroundColor: label.bg }}
    >
      {label.text}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

const CHANGELOG_PREVIEW = 5;

/** The newest releases first; older ones on request. */
export function ChangelogList() {
  const entries = changelog as ChangelogEntry[];
  const [all, setAll] = useState(false);
  const shown = all ? entries : entries.slice(0, CHANGELOG_PREVIEW);
  return (
    <div className="flex flex-col gap-4">
      {shown.map((entry) => (
        <article
          key={entry.version}
          data-changelog-entry={entry.version}
          className="rounded-control border border-line p-4 lg:p-5"
        >
          <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-bold text-ink-900 text-lg tabular-nums">
              v{entry.version}
            </span>
            <time className="text-ink-500 text-sm" dateTime={entry.date}>
              {formatDate(entry.date)}
            </time>
            <span className="ml-auto">
              <TypeTag type={entry.type} />
            </span>
          </header>
          <h3 className="mt-2 font-semibold text-base text-ink-900 leading-7">
            {entry.title}
          </h3>
          <p className="mt-1 text-[0.9375rem] text-ink-700 leading-[1.7]">
            {entry.summary}
          </p>
          <ul className="mt-3 space-y-2 border-line border-t pt-3">
            {entry.changes.map((change) => (
              <li
                key={change.description}
                className="flex items-start gap-2.5 text-[0.9375rem] text-ink-700 leading-[1.7]"
              >
                <span className="mt-0.5 shrink-0">
                  <TypeTag type={change.type} />
                </span>
                <span className="min-w-0 break-words">
                  {change.description}
                </span>
              </li>
            ))}
          </ul>
        </article>
      ))}
      {entries.length > CHANGELOG_PREVIEW && (
        <button
          type="button"
          onClick={() => setAll((value) => !value)}
          aria-expanded={all}
          className="mx-auto h-10 cursor-pointer rounded-control border border-line-strong bg-surface px-5 font-semibold text-ink-700 text-sm hover:bg-field"
        >
          {all ? "只顯示最近的版本" : `顯示全部 ${entries.length} 個版本`}
        </button>
      )}
    </div>
  );
}

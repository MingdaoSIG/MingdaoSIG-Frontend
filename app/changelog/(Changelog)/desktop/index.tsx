"use client";

import { DocPage } from "@/components/desktop/DocPage";
import changelog from "../config/changelog.json";

type ChangeType = "feature" | "improvement" | "fix" | "security";

interface Change {
  type: ChangeType;
  description: string;
}

interface ChangelogEntry {
  version: string;
  date: string;
  type: ChangeType;
  title: string;
  summary: string;
  changes: Change[];
}

// Muted semantic colours: readable text on a light tint (AA on white)
const typeLabels: Record<ChangeType, { text: string; fg: string; bg: string }> =
  {
    feature: { text: "新功能", fg: "#1d6b46", bg: "#e6f3ec" },
    improvement: { text: "優化", fg: "#0b5a83", bg: "#e5edf3" },
    fix: { text: "修復", fg: "#85530a", bg: "#f8efdc" },
    security: { text: "安全性", fg: "#b42318", bg: "#fbeceb" },
  };

function TypeTag({ type }: { type: ChangeType }) {
  const label = typeLabels[type];
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-chip px-2 py-0.5 font-semibold text-xs"
      style={{ color: label.fg, backgroundColor: label.bg }}
    >
      {label.text}
    </span>
  );
}

export default function Desktop() {
  const typedChangelog = changelog as ChangelogEntry[];

  return (
    <DocPage
      title="更新紀錄"
      description="MDSIG 平台的版本與變更"
      width="narrow"
    >
      {typedChangelog.map((entry) => (
        <article
          key={entry.version}
          className="rounded-card border border-line bg-surface p-6 shadow-card"
        >
          <header className="flex items-center gap-3">
            <span className="font-bold text-ink-900 text-xl tabular-nums">
              v{entry.version}
            </span>
            <time className="text-ink-500 text-sm" dateTime={entry.date}>
              {formatDate(entry.date)}
            </time>
            <span className="ml-auto">
              <TypeTag type={entry.type} />
            </span>
          </header>

          <h2 className="mt-3 font-semibold text-ink-900 text-lg leading-7">
            {entry.title}
          </h2>
          <p className="mt-1 text-[0.9375rem] text-ink-700 leading-[1.7]">
            {entry.summary}
          </p>

          <ul className="mt-4 space-y-2 border-line border-t pt-4">
            {entry.changes.map((change) => (
              <li
                key={change.description}
                className="flex items-start gap-2.5 text-[0.9375rem] text-ink-700 leading-[1.7]"
              >
                <span className="mt-0.5">
                  <TypeTag type={change.type} />
                </span>
                <span>{change.description}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </DocPage>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

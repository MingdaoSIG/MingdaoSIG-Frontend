"use client";

import changelog from "../config/changelog.json";
import styles from "./index.module.scss";

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

// Muted semantic colours (same as desktop): readable text on a light tint
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
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-chip px-1.5 py-0.5 font-semibold text-[11px]"
      style={{ color: label.fg, backgroundColor: label.bg }}
    >
      {label.text}
    </span>
  );
}

export default function Mobile() {
  const typedChangelog = changelog as ChangelogEntry[];

  return (
    <div className={styles.mobileView}>
      <div className={styles.wrapper}>
        <div className="scrollbar-hide h-[83dvh] w-full space-y-3 overflow-auto">
          {typedChangelog.map((entry) => (
            <article
              key={entry.version}
              className="rounded-card border border-line bg-surface p-4 shadow-card"
            >
              <header className="flex items-center gap-2">
                <span className="font-bold text-ink-900 text-lg tabular-nums">
                  v{entry.version}
                </span>
                <TypeTag type={entry.type} />
                <time
                  className="ml-auto text-ink-500 text-xs"
                  dateTime={entry.date}
                >
                  {formatDate(entry.date)}
                </time>
              </header>

              <h2 className="mt-2 font-semibold text-base text-ink-900">
                {entry.title}
              </h2>
              <p className="mt-1 text-ink-700 text-sm leading-[1.65]">
                {entry.summary}
              </p>

              <ul className="mt-3 space-y-2 border-line border-t pt-3">
                {entry.changes.map((change) => (
                  <li
                    key={change.description}
                    className="flex items-start gap-2 text-ink-700 text-sm leading-[1.65]"
                  >
                    <span className="mt-0.5 shrink-0">
                      <TypeTag type={change.type} />
                    </span>
                    <span>{change.description}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}/${month}/${day}`;
}

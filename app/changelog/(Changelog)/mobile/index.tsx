"use client";

import { Fragment } from "react";
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

const typeLabels: Record<ChangeType, { text: string; color: string }> = {
  feature: { text: "新功能", color: "#22c55e" },
  improvement: { text: "優化", color: "#3b82f6" },
  fix: { text: "修復", color: "#f59e0b" },
  security: { text: "安全性", color: "#ef4444" },
};

// 版本標題純色背景
const versionBgColors: Record<ChangeType, string> = {
  feature: "#dcfce7",
  improvement: "#dbeafe",
  fix: "#fef3c7",
  security: "#fee2e2",
};

export default function Mobile() {
  const typedChangelog = changelog as ChangelogEntry[];

  return (
    <div className={styles.mobileView}>
      <div className={styles.wrapper}>
        <div className="scrollbar-hide h-[83dvh] w-full space-y-4 overflow-auto">
          {typedChangelog.map((entry, _index) => (
            <Fragment key={entry.version}>
              <div
                className="rounded-2xl bg-white p-4 shadow-sm"
                style={{
                  borderLeft: `4px solid ${typeLabels[entry.type].color}`,
                }}
              >
                {/* Version Header - 純色背景 */}
                <div
                  className="mb-3 flex items-center justify-between rounded p-2"
                  style={{
                    backgroundColor: versionBgColors[entry.type],
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#003f47] text-lg">
                      v{entry.version}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px]"
                      style={{
                        backgroundColor: typeLabels[entry.type].color,
                        color: "white",
                      }}
                    >
                      {typeLabels[entry.type].text}
                    </span>
                  </div>
                  <span className="text-[#003f47]/50 text-xs">
                    {formatDate(entry.date)}
                  </span>
                </div>

                {/* Title & Summary */}
                <h2 className="mb-1 font-medium text-[#003f47] text-base">
                  {entry.title}
                </h2>
                <p className="mb-3 text-[#003f47]/70 text-xs">
                  {entry.summary}
                </p>

                {/* Changes List */}
                <ul className="space-y-2">
                  {entry.changes.map((change) => (
                    <li
                      key={change.description}
                      className="flex items-start gap-2 text-[#003f47] text-xs"
                    >
                      <span
                        className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor: typeLabels[change.type].color,
                        }}
                      />
                      <span
                        className="inline-block flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] text-white"
                        style={{
                          backgroundColor: typeLabels[change.type].color,
                        }}
                      >
                        {typeLabels[change.type].text}
                      </span>
                      <span className="leading-relaxed">
                        {change.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Fragment>
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

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
        <div className="space-y-4 overflow-auto h-[83dvh] w-full scrollbar-hide">
          {typedChangelog.map((entry, _index) => (
            <Fragment key={entry.version}>
              <div
                className="bg-white rounded-2xl p-4 shadow-sm"
                style={{
                  borderLeft: `4px solid ${typeLabels[entry.type].color}`,
                }}
              >
                {/* Version Header - 純色背景 */}
                <div
                  className="flex items-center justify-between mb-3 p-2 rounded"
                  style={{
                    backgroundColor: versionBgColors[entry.type],
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#003f47]">
                      v{entry.version}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: typeLabels[entry.type].color,
                        color: "white",
                      }}
                    >
                      {typeLabels[entry.type].text}
                    </span>
                  </div>
                  <span className="text-xs text-[#003f47]/50">
                    {formatDate(entry.date)}
                  </span>
                </div>

                {/* Title & Summary */}
                <h2 className="text-base font-medium text-[#003f47] mb-1">
                  {entry.title}
                </h2>
                <p className="text-xs text-[#003f47]/70 mb-3">
                  {entry.summary}
                </p>

                {/* Changes List */}
                <ul className="space-y-2">
                  {entry.changes.map((change, changeIndex) => (
                    <li
                      key={changeIndex}
                      className="flex items-start gap-2 text-xs text-[#003f47]"
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                        style={{
                          backgroundColor: typeLabels[change.type].color,
                        }}
                      />
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] text-white flex-shrink-0"
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

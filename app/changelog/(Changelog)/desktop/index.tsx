"use client";

import { Fragment } from "react";
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

export default function Desktop() {
  const typedChangelog = changelog as ChangelogEntry[];

  return (
    <>
      <div className="mx-auto h-full w-[90vw] overflow-hidden rounded-[1.2rem]">
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden rounded-[1.2rem] bg-white p-6 pr-3">
            <div className="h-full flex-1 space-y-6 overflow-y-auto pr-3">
              {typedChangelog.map((entry, index) => (
                <Fragment key={entry.version}>
                  <div className="relative">
                    <div
                      className="mb-3 flex items-center gap-3 rounded-lg p-3"
                      style={{
                        backgroundColor: versionBgColors[entry.type],
                      }}
                    >
                      <span className="font-bold text-[#003f47] text-xl">
                        v{entry.version}
                      </span>
                      <span className="text-[#003f47]/70 text-sm">
                        {formatDate(entry.date)}
                      </span>
                      <span
                        className="ml-auto rounded-full px-2 py-1 text-xs"
                        style={{
                          backgroundColor: typeLabels[entry.type].color,
                          color: "white",
                        }}
                      >
                        {typeLabels[entry.type].text}
                      </span>
                    </div>

                    {/* Title & Summary */}
                    <h2 className="mb-1 font-medium text-[#003f47] text-lg">
                      {entry.title}
                    </h2>
                    <p className="mb-3 text-[#003f47]/70 text-sm">
                      {entry.summary}
                    </p>

                    {/* Changes List */}
                    <ul className="space-y-2">
                      {entry.changes.map((change) => (
                        <li
                          key={change.description}
                          className="flex items-start gap-2 text-[#003f47] text-sm"
                        >
                          <span
                            className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                            style={{
                              backgroundColor: typeLabels[change.type].color,
                            }}
                          />
                          <span
                            className="inline-block flex-shrink-0 rounded px-2 py-0.5 text-white text-xs"
                            style={{
                              backgroundColor: typeLabels[change.type].color,
                            }}
                          >
                            {typeLabels[change.type].text}
                          </span>
                          <span>{change.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Divider */}
                  {index < typedChangelog.length - 1 && (
                    <hr className="border-[#003f47]/10" />
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

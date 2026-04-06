"use client";

import Link from "next/link";
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
      <div className="w-[90vw] h-full mx-auto rounded-[1.2rem] overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden">
          <div className="bg-white rounded-[1.2rem] overflow-hidden p-6 pr-3 flex-1">
            <div className="space-y-6 overflow-y-auto h-full flex-1 pr-3">
              {typedChangelog.map((entry, index) => (
                <Fragment key={entry.version}>
                  <div className="relative">
                    <div
                      className="flex items-center gap-3 mb-3 p-3 rounded-lg"
                      style={{
                        backgroundColor: versionBgColors[entry.type],
                      }}
                    >
                      <span className="text-xl font-bold text-[#003f47]">
                        v{entry.version}
                      </span>
                      <span className="text-sm text-[#003f47]/70">
                        {formatDate(entry.date)}
                      </span>
                      <span
                        className="text-xs px-2 py-1 rounded-full ml-auto"
                        style={{
                          backgroundColor: typeLabels[entry.type].color,
                          color: "white",
                        }}
                      >
                        {typeLabels[entry.type].text}
                      </span>
                    </div>

                    {/* Title & Summary */}
                    <h2 className="text-lg font-medium text-[#003f47] mb-1">
                      {entry.title}
                    </h2>
                    <p className="text-sm text-[#003f47]/70 mb-3">
                      {entry.summary}
                    </p>

                    {/* Changes List */}
                    <ul className="space-y-2">
                      {entry.changes.map((change, changeIndex) => (
                        <li
                          key={changeIndex}
                          className="flex items-start gap-2 text-sm text-[#003f47]"
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                            style={{
                              backgroundColor: typeLabels[change.type].color,
                            }}
                          />
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs text-white flex-shrink-0"
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

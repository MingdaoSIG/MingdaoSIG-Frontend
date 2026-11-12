"use client";

import type { HomeFeed } from "../useHomeFeed";

/** 「最新 / 熱門 / 我的 SIG」 above the desktop home list. */
export function FeedTabs({
  value,
  onChange,
  showMySig,
}: {
  value: HomeFeed;
  onChange: (value: HomeFeed) => void;
  showMySig: boolean;
}) {
  const tabs: { value: HomeFeed; label: string }[] = [
    { value: "latest", label: "最新" },
    { value: "top", label: "熱門" },
    ...(showMySig ? [{ value: "mysig" as const, label: "我的 SIG" }] : []),
  ];

  return (
    <div
      role="tablist"
      aria-label="首頁貼文"
      className="mb-4 flex w-fit shrink-0 select-none gap-0.5 rounded-control border border-line bg-surface p-0.5 shadow-card"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`h-9 cursor-pointer rounded-[6px] px-4 font-semibold text-sm transition-colors ${
              active ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-field"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

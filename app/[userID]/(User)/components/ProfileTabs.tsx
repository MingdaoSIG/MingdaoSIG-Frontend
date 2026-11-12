"use client";

export type ProfileTab = "posts" | "liked";

const TABS: { value: ProfileTab; label: string }[] = [
  { value: "posts", label: "貼文" },
  { value: "liked", label: "按讚過的貼文" },
];

/** 「貼文 / 按讚過的貼文」 above the list on your own profile. */
export function ProfileTabs({
  value,
  onChange,
  mobile = false,
}: {
  value: ProfileTab;
  onChange: (value: ProfileTab) => void;
  mobile?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="個人頁面內容"
      className="flex w-fit shrink-0 select-none gap-0.5 rounded-control border border-line bg-surface p-0.5 shadow-card"
    >
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`cursor-pointer rounded-[6px] px-4 font-semibold text-sm transition-colors ${
              mobile ? "h-11" : "h-9"
            } ${
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

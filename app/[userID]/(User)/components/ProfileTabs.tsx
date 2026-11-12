"use client";

import { useUserSeries } from "@/modules/series";

export type ProfileTab = "posts" | "liked" | "bookmarks" | "series" | "stats";

const LABELS: Record<ProfileTab, string> = {
  posts: "貼文",
  liked: "按讚過的貼文",
  bookmarks: "收藏",
  series: "系列",
  stats: "我的數據",
};

/** Your own profile; someone else's shows only 貼文 / 系列. */
export const OWN_TABS: ProfileTab[] = [
  "posts",
  "liked",
  "bookmarks",
  "series",
  "stats",
];
export const PUBLIC_TABS: ProfileTab[] = ["posts", "series"];

export function isProfileTab(value: unknown): value is ProfileTab {
  return typeof value === "string" && value in LABELS;
}

/** The tab bar above the list on a profile (scrolls sideways on phones). */
export function ProfileTabs({
  value,
  onChange,
  tabs = OWN_TABS,
  mobile = false,
}: {
  value: ProfileTab;
  onChange: (value: ProfileTab) => void;
  tabs?: ProfileTab[];
  mobile?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="個人頁面內容"
      className={`flex shrink-0 select-none gap-0.5 rounded-control border border-line bg-surface p-0.5 shadow-card ${
        mobile ? "scrollbar-hide w-full overflow-x-auto" : "w-fit"
      }`}
    >
      {tabs.map((tab) => {
        const active = tab === value;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab)}
            className={`shrink-0 cursor-pointer whitespace-nowrap rounded-[6px] px-4 font-semibold text-sm transition-colors ${
              mobile ? "h-11 flex-1" : "h-9"
            } ${
              active ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-field"
            }`}
          >
            {LABELS[tab]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Which tabs a profile shows: all of them on your own, 貼文 / 系列 on
 * someone else's (only when they have a series), none on a SIG.
 */
export function useProfileTabs(
  dataType: "user" | "sig" | null,
  id: string,
  isOwn: boolean,
) {
  const series = useUserSeries(dataType === "user" && !isOwn ? id : null);
  if (dataType !== "user" || !id) {
    return [];
  }
  if (isOwn) {
    return OWN_TABS;
  }
  return (series.data?.length ?? 0) > 0 ? PUBLIC_TABS : [];
}

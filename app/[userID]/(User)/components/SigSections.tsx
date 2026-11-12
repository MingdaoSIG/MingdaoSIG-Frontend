"use client";

import { type ReactNode, useState } from "react";
import { SigEventList } from "@/components/SigEvents/SigEventList";
import {
  featuredPostsOf,
  SigShowcase,
} from "@/components/SigShowcase/SigShowcase";
import type { Sig } from "@/interfaces/Sig";
import { useSigManager } from "../useSigManager";

// The SIG page's main column: 精選成果 on top, then 貼文 / 活動. The
// pieces are self-contained (SigShowcase, SigEventList), so the SIG page
// redesign can move them; this file is only the glue for today's layout.
// `?tab=events` (the link in event notifications) opens 活動.

export type SigTab = "posts" | "events";

const TABS: { value: SigTab; label: string }[] = [
  { value: "posts", label: "貼文" },
  { value: "events", label: "活動" },
];

const ANNOUNCEMENT_SIG_ID = "652d60b842cdf6a660c2b778";

function initialTab(): SigTab {
  if (typeof window === "undefined") {
    return "posts";
  }
  const value = new URLSearchParams(window.location.search).get("tab");
  return value === "events" ? "events" : "posts";
}

/** Keeps `?tab=` in the address bar without a navigation. */
function rememberTab(tab: SigTab) {
  const url = new URL(window.location.href);
  if (tab === "posts") {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", tab);
  }
  window.history.replaceState(window.history.state, "", url.toString());
}

function SigTabs({
  value,
  onChange,
  mobile,
}: {
  value: SigTab;
  onChange: (value: SigTab) => void;
  mobile: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="SIG 內容"
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

export function SigSections({
  sig,
  posts,
  variant = "desktop",
}: {
  sig: Sig;
  /** The SIG's post list, as the page renders it today. */
  posts: ReactNode;
  variant?: "desktop" | "mobile";
}) {
  const mobile = variant === "mobile";
  const manager = useSigManager(sig, true);
  const [tab, setTabState] = useState<SigTab>(initialTab);
  const setTab = (next: SigTab) => {
    setTabState(next);
    rememberTab(next);
  };
  // The announcement SIG is only a channel for announcements.
  const plain = sig._id === ANNOUNCEMENT_SIG_ID;
  const featured = featuredPostsOf(sig);

  if (plain) {
    return <>{posts}</>;
  }

  return (
    <div
      className={
        mobile ? "flex h-full min-h-0 flex-col gap-2" : "flex flex-col gap-4"
      }
    >
      <div className={mobile ? "shrink-0" : undefined}>
        <SigShowcase posts={featured} variant={variant} />
      </div>
      <SigTabs value={tab} onChange={setTab} mobile={mobile} />
      {tab === "events" ? (
        <div
          className={
            mobile ? "scrollbar-hide min-h-0 flex-1 overflow-y-auto pb-4" : ""
          }
        >
          <SigEventList
            sig={{ _id: sig._id, name: sig.name, customId: sig.customId }}
            canManage={manager.canManage}
            variant={variant}
          />
        </div>
      ) : mobile ? (
        <div className="min-h-0 flex-1">{posts}</div>
      ) : (
        posts
      )}
    </div>
  );
}

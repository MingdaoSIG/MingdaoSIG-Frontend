"use client";

import { MicOff, ShieldBan } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  activeSuspension,
  getReportedSuspension,
  type Suspension,
  subscribeSuspension,
  suspensionHeadline,
} from "@/modules/suspension";
import { sessionGet, sessionSet } from "@/utils/safeStorage";
import { BannerBar } from "./BannerBar";

// Tells a muted or banned user so (contract v4 §5.1): 「你的帳號已被禁言至
// … 原因：…」. It reads modules/suspension, which `/user/me` and every
// 4041 feed, so it also shows for a banned visitor whose login was
// refused. Hiding it lasts for this tab only.

const HIDDEN_KEY = "mdsig-suspension-hidden";

/** The suspension in force for this tab, re-checked as time passes. */
export function useSuspension(): Suspension | null {
  const reported = useSyncExternalStore(
    subscribeSuspension,
    getReportedSuspension,
    () => null,
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!reported?.until) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => window.clearInterval(timer);
  }, [reported?.until]);
  return activeSuspension(reported, now);
}

function signature(suspension: Suspension) {
  return `${suspension.type}|${suspension.until ?? ""}|${suspension.reason}`;
}

const AFTER: Record<Suspension["type"], string> = {
  mute: "期間仍可閱讀、檢舉、收藏與編輯草稿。",
  ban: "期間無法登入使用。",
};

export function SuspensionBanner({ layout = "page" }: { layout?: "page" }) {
  const suspension = useSuspension();
  const [hidden, setHidden] = useState(() => sessionGet(HIDDEN_KEY));

  if (!suspension || hidden === signature(suspension)) {
    return null;
  }

  return (
    <BannerBar
      tone={suspension.type === "ban" ? "danger" : "warning"}
      icon={suspension.type === "ban" ? ShieldBan : MicOff}
      layout={layout}
      role="alert"
      dismissLabel="暫時隱藏這則提示"
      onDismiss={() => {
        const value = signature(suspension);
        sessionSet(HIDDEN_KEY, value);
        setHidden(value);
      }}
    >
      <span className="font-semibold">{suspensionHeadline(suspension)}</span>
      {suspension.reason && <>。原因：{suspension.reason}</>}
      <span className="text-ink-500">
        {suspension.reason ? "　" : "。"}
        {AFTER[suspension.type]}
      </span>
    </BannerBar>
  );
}

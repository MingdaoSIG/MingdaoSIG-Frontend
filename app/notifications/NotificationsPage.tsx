"use client";

import { Settings } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { DocPage } from "@/components/desktop/DocPage";
import { PageTitle } from "@/components/mobile/PageTitle";
import { InstallNotice } from "@/components/Notifications/InstallPrompt";
import { NotificationCenter } from "@/components/Notifications/NotificationCenter";
import { NotificationSettingsDialog } from "@/components/Notifications/NotificationSettings";
import { formatUnread } from "@/modules/notifications/describe";
import useIsMobile from "@/utils/useIsMobile";
import { useUnreadCount } from "@/utils/useNotifications";
import { useUserAccount } from "@/utils/useUserAccount";

// /notifications (api-contract-v4 §2.1, redesign v3 4B): every
// notification grouped 今天 / 本週 / 更早 with the 全部 / 未讀 / 互動 / SIG
// chips (components/Notifications/NotificationCenter), and the way to the
// notification settings. `?settings=1` opens the settings. On desktop the
// side rail's 通知 opens the same list in a side panel.

const secondaryButton =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface px-3.5 font-semibold text-ink-700 text-sm transition-colors hover:bg-field";

export default function NotificationsPage() {
  const isMobile = useIsMobile();
  const params = useSearchParams();
  const { isLogin } = useUserAccount();
  const [settingsOpen, setSettingsOpen] = useState(
    params.get("settings") === "1",
  );
  const { unread } = useUnreadCount();

  const summary =
    unread > 0 ? `${formatUnread(unread)} 則未讀` : "沒有未讀的通知";

  const settingsButton = (
    <button
      type="button"
      className={`${secondaryButton} ${isMobile ? "h-10" : "h-9"}`}
      onClick={() => setSettingsOpen(true)}
    >
      <Settings size={16} aria-hidden />
      通知設定
    </button>
  );

  const dialog = isLogin && (
    <NotificationSettingsDialog
      open={settingsOpen}
      mobile={isMobile}
      onClose={() => setSettingsOpen(false)}
    />
  );

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <PageTitle title="通知" />
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-4">
          {isLogin && (
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-ink-500 text-sm" aria-live="polite">
                {summary}
              </p>
              {settingsButton}
            </div>
          )}
          {isLogin && <InstallNotice mobile />}
          <NotificationCenter mobile />
        </div>
        {dialog}
      </div>
    );
  }

  return (
    <DocPage
      title="通知"
      width="narrow"
      description={isLogin ? summary : undefined}
      actions={isLogin ? settingsButton : undefined}
    >
      {isLogin && <InstallNotice />}
      <NotificationCenter />
      {dialog}
    </DocPage>
  );
}

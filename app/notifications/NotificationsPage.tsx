"use client";

import { Bell, CheckCheck, Settings } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";

import { DocPage } from "@/components/desktop/DocPage";
import { PageTitle } from "@/components/mobile/PageTitle";
import { InstallNotice } from "@/components/Notifications/InstallPrompt";
import {
  NotificationItem,
  NotificationSkeleton,
} from "@/components/Notifications/NotificationItem";
import { NotificationSettingsDialog } from "@/components/Notifications/NotificationSettings";
import type { TNotification } from "@/interfaces/Notification";
import { formatUnread } from "@/modules/notifications/describe";
import useIsMobile from "@/utils/useIsMobile";
import {
  type NotificationFilter,
  useMarkRead,
  useNotificationList,
  useUnreadCount,
} from "@/utils/useNotifications";
import { useUserAccount } from "@/utils/useUserAccount";

// /notifications (api-contract-v4 §2.1): every notification, newest first,
// with 全部 / 未讀, mark one (by opening it) or all read, and the way to
// the notification settings. `?settings=1` opens the settings.

const FILTERS: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "unread", label: "未讀" },
];

function FilterTabs({
  value,
  onChange,
  mobile,
}: {
  value: NotificationFilter;
  onChange: (value: NotificationFilter) => void;
  mobile: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="顯示哪些通知"
      className="flex w-fit shrink-0 select-none gap-0.5 rounded-control border border-line bg-surface p-0.5 shadow-card"
    >
      {FILTERS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`cursor-pointer rounded-[6px] px-4 font-semibold text-sm transition-colors ${
              mobile ? "h-10" : "h-9"
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

const secondaryButton =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface px-3.5 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-default disabled:text-ink-400 disabled:hover:bg-surface";

export default function NotificationsPage() {
  const isMobile = useIsMobile();
  const params = useSearchParams();
  const { isLogin, isLoading, login } = useUserAccount();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [settingsOpen, setSettingsOpen] = useState(
    params.get("settings") === "1",
  );
  const [markError, setMarkError] = useState<string | null>(null);
  const { unread } = useUnreadCount();
  const list = useNotificationList(filter);
  const markRead = useMarkRead();

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  function openItem(notification: TNotification) {
    if (!notification.read) {
      void markRead([notification]);
    }
  }

  async function markAll() {
    setMarkError(null);
    const result = await markRead("all");
    if (!result.ok) {
      setMarkError(`沒有標為已讀：${result.message}`);
    }
  }

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

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <FilterTabs value={filter} onChange={setFilter} mobile={isMobile} />
      <button
        type="button"
        className={`${secondaryButton} ${isMobile ? "h-10" : "h-9"} ml-auto`}
        disabled={unread === 0}
        onClick={() => void markAll()}
      >
        <CheckCheck size={16} aria-hidden />
        全部標為已讀
      </button>
      {markError && (
        <p role="alert" className="w-full text-danger-700 text-xs">
          {markError}
        </p>
      )}
    </div>
  );

  let content: ReactNode;
  if (isLoading || (isLogin && list.isPending)) {
    content = (
      <ListCard>
        <NotificationSkeleton rows={5} />
      </ListCard>
    );
  } else if (!isLogin) {
    content = (
      <ListCard>
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Bell size={28} className="text-ink-400" aria-hidden />
          <p className="text-ink-700">登入後就能看到你的通知。</p>
          <button
            type="button"
            className="h-10 cursor-pointer rounded-control bg-brand-700 px-6 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
            onClick={() => login()}
          >
            登入
          </button>
        </div>
      </ListCard>
    );
  } else if (list.isError && items.length === 0) {
    content = (
      <ListCard>
        <div
          role="alert"
          className="flex flex-col items-center gap-3 px-6 py-12 text-center text-ink-500"
        >
          <p>{list.error.message}</p>
          <button
            type="button"
            className="cursor-pointer rounded-control border border-line px-4 py-2 text-ink-800 text-sm hover:bg-field"
            onClick={() => void list.refetch()}
          >
            重試
          </button>
        </div>
      </ListCard>
    );
  } else if (items.length === 0) {
    content = (
      <ListCard>
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Bell size={28} className="text-ink-400" aria-hidden />
          <p className="font-semibold text-ink-800">
            {filter === "unread" ? "沒有未讀的通知" : "目前沒有通知"}
          </p>
          {filter === "all" && (
            <p className="text-ink-500 text-sm">
              有人留言、回覆或對你的貼文按讚時，會在這裡通知你。
            </p>
          )}
        </div>
      </ListCard>
    );
  } else {
    content = (
      <ListCard>
        <ul className="divide-y divide-line" aria-label="通知列表">
          {items.map((item) => (
            <NotificationItem
              key={item._id}
              notification={item}
              onOpen={openItem}
            />
          ))}
        </ul>
        {list.hasNextPage && (
          <div className="border-line border-t p-3 text-center">
            <button
              type="button"
              className={`${secondaryButton} h-9`}
              disabled={list.isFetchingNextPage}
              onClick={() => void list.fetchNextPage()}
            >
              {list.isFetchingNextPage ? "載入中…" : "載入更多"}
            </button>
          </div>
        )}
        {list.isError && items.length > 0 && (
          <p
            role="alert"
            className="px-4 py-3 text-center text-ink-500 text-sm"
          >
            {list.error.message}
          </p>
        )}
      </ListCard>
    );
  }

  const dialog = isLogin && (
    <NotificationSettingsDialog
      open={settingsOpen}
      mobile={isMobile}
      onClose={() => setSettingsOpen(false)}
    />
  );

  if (isMobile) {
    return (
      <div className="flex h-dvh flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
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
          {isLogin && controls}
          {content}
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
      {isLogin && controls}
      {content}
      {dialog}
    </DocPage>
  );
}

function ListCard({ children }: { children: ReactNode }) {
  return (
    <section className="shrink-0 overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {children}
    </section>
  );
}

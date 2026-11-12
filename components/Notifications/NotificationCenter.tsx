"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import type {
  NotificationType,
  TNotification,
} from "@/interfaces/Notification";
import { apiRequest } from "@/modules/api/client";
import { safeNotificationLink } from "@/modules/notifications/describe";
import {
  type NotificationFilter,
  useMarkRead,
  useNotificationList,
  useUnreadCount,
} from "@/utils/useNotifications";
import { useUserAccount } from "@/utils/useUserAccount";
import { NotificationItem, NotificationSkeleton } from "./NotificationItem";

// The notification list of the 2026 redesign (v3 4B), shared by
// /notifications and the desktop side panel: grouped 今天 / 本週 / 更早,
// chips 全部 / 未讀 / 互動 / SIG, an unread colour bar, and 同意 / 拒絕
// right on a join request for the SIG's managers.

export type NotificationChip = "all" | "unread" | "social" | "sig";

const CHIPS: { value: NotificationChip; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "unread", label: "未讀" },
  { value: "social", label: "互動" },
  { value: "sig", label: "SIG" },
];

/** 互動 and SIG are views of the full list; 未讀 asks the server. */
const CHIP_TYPES: Partial<Record<NotificationChip, NotificationType[]>> = {
  social: ["comment", "reply", "like", "feedback"],
  sig: ["join_request", "join_result", "event", "system"],
};

const DAY_MS = 24 * 60 * 60 * 1000;

type Group = { key: string; label: string; items: TNotification[] };

/** 今天 (since midnight), 本週 (the 6 days before), 更早. */
export function groupByTime(items: TNotification[], now: Date = new Date()) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const today = midnight.getTime();
  const week = today - 6 * DAY_MS;
  const groups: Group[] = [
    { key: "today", label: "今天", items: [] },
    { key: "week", label: "本週", items: [] },
    { key: "earlier", label: "更早", items: [] },
  ];
  for (const item of items) {
    const time = new Date(item.createdAt).getTime();
    const index = Number.isNaN(time)
      ? 2
      : time >= today
        ? 0
        : time >= week
          ? 1
          : 2;
    groups[index].items.push(item);
  }
  return groups.filter((group) => group.items.length > 0);
}

const secondaryButton =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-default disabled:text-ink-400 disabled:hover:bg-surface";

type Decision = "idle" | "busy" | "accepted" | "rejected";

/** 同意 / 拒絕 on a join request (`meta.request`), for the SIG's managers. */
function JoinRequestActions({
  notification,
  onDecided,
  mobile,
}: {
  notification: TNotification;
  onDecided: (notification: TNotification) => void;
  mobile: boolean;
}) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<Decision>("idle");
  const [error, setError] = useState<string | null>(null);
  const requestId =
    typeof notification.meta?.request === "string"
      ? notification.meta.request
      : "";
  const count =
    typeof notification.meta?.count === "number" ? notification.meta.count : 1;
  const href = safeNotificationLink(notification.link);
  const height = mobile ? "h-10" : "h-8";

  // Several requests collapsed into one notification: decide them in the
  // list, where each applicant's answers are shown.
  if (!requestId || count > 1) {
    return href ? (
      <Link href={href} className={`${secondaryButton} ${height}`}>
        {count > 1 ? `查看 ${count} 筆申請` : "查看申請"}
      </Link>
    ) : null;
  }

  async function decide(accept: boolean) {
    setState("busy");
    setError(null);
    const result = await apiRequest(
      `/admin/join-requests/${encodeURIComponent(requestId)}/decision`,
      { method: "POST", body: { accept }, auth: true },
    );
    if (!result.ok) {
      setState("idle");
      setError(
        result.kind === "not-found"
          ? "這筆申請已經不存在"
          : `沒有完成：${result.message}`,
      );
      return;
    }
    setState(accept ? "accepted" : "rejected");
    onDecided(notification);
    void queryClient.invalidateQueries({ queryKey: ["admin"] });
  }

  if (state === "accepted" || state === "rejected") {
    return (
      <output
        className={`block font-semibold text-sm ${
          state === "accepted" ? "text-ok-700" : "text-ink-500"
        }`}
      >
        {state === "accepted" ? "已同意加入" : "已拒絕"}
      </output>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2" data-join-actions>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={() => void decide(true)}
        className={`inline-flex ${height} cursor-pointer items-center rounded-control bg-brand-700 px-4 font-semibold text-sm text-white transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-60`}
      >
        同意
      </button>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={() => void decide(false)}
        className={`${secondaryButton} ${height}`}
      >
        拒絕
      </button>
      {href && (
        <Link
          href={href}
          className="font-semibold text-brand-700 text-sm hover:underline"
        >
          看申請內容
        </Link>
      )}
      {error && (
        <p role="alert" className="w-full text-danger-700 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

export function NotificationCenter({
  variant = "page",
  mobile = false,
  onNavigate,
}: {
  /** "panel": the desktop side panel (no card around the list). */
  variant?: "page" | "panel";
  mobile?: boolean;
  /** Called when an item opens a page (the panel closes itself). */
  onNavigate?: () => void;
}) {
  const { isLogin, isLoading, login } = useUserAccount();
  const [chip, setChip] = useState<NotificationChip>("all");
  const [markError, setMarkError] = useState<string | null>(null);
  const filter: NotificationFilter = chip === "unread" ? "unread" : "all";
  const list = useNotificationList(filter);
  const markRead = useMarkRead();
  const { unread } = useUnreadCount();
  const panel = variant === "panel";

  const loaded = list.data?.pages.flatMap((page) => page.items) ?? [];
  const types = CHIP_TYPES[chip];
  const items = types
    ? loaded.filter((item) => types.includes(item.type))
    : loaded;
  const groups = useMemo(() => groupByTime(items), [items]);

  function openItem(notification: TNotification) {
    if (!notification.read) {
      void markRead([notification]);
    }
    if (safeNotificationLink(notification.link)) {
      onNavigate?.();
    }
  }

  async function markAll() {
    setMarkError(null);
    const result = await markRead("all");
    if (!result.ok) {
      setMarkError(`沒有標為已讀：${result.message}`);
    }
  }

  const height = mobile ? "h-10" : "h-8";
  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="tablist"
        aria-label="顯示哪些通知"
        className="flex flex-wrap gap-1.5"
      >
        {CHIPS.map((option) => {
          const active = option.value === chip;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              data-chip={option.value}
              onClick={() => setChip(option.value)}
              className={`cursor-pointer rounded-full border px-3 font-semibold text-sm transition-colors ${height} ${
                active
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-line-strong bg-surface text-ink-700 hover:bg-field"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className={`${secondaryButton} ${height} ml-auto`}
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

  const card = (children: ReactNode) =>
    panel ? (
      <div>{children}</div>
    ) : (
      <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        {children}
      </section>
    );

  let content: ReactNode;
  if (isLoading || (isLogin && list.isPending)) {
    content = card(<NotificationSkeleton rows={5} />);
  } else if (!isLogin) {
    content = card(
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
      </div>,
    );
  } else if (list.isError && loaded.length === 0) {
    content = card(
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
      </div>,
    );
  } else {
    content = card(
      <>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Bell size={28} className="text-ink-400" aria-hidden />
            <p className="font-semibold text-ink-800">
              {chip === "unread"
                ? "沒有未讀的通知"
                : chip === "all"
                  ? "目前沒有通知"
                  : loaded.length > 0 && list.hasNextPage
                    ? "最近的通知裡沒有這一類"
                    : "沒有這一類的通知"}
            </p>
            {chip === "all" && (
              <p className="text-ink-500 text-sm">
                有人留言、回覆或對你的貼文按讚時，會在這裡通知你。
              </p>
            )}
          </div>
        ) : (
          groups.map((group) => (
            <section
              key={group.key}
              aria-label={group.label}
              data-group={group.key}
            >
              <h3 className="border-line border-b bg-field/60 px-4 py-1.5 font-semibold text-ink-500 text-xs sm:px-5">
                {group.label}
              </h3>
              <ul className="divide-y divide-line [&>li[data-unread=true]]:shadow-[inset_3px_0_0_var(--color-brand-700)]">
                {group.items.map((item) => (
                  <NotificationItem
                    key={item._id}
                    notification={item}
                    onOpen={openItem}
                    compact={panel}
                    actions={
                      item.type === "join_request" ? (
                        <JoinRequestActions
                          notification={item}
                          mobile={mobile}
                          onDecided={(done) => {
                            if (!done.read) {
                              void markRead([done]);
                            }
                          }}
                        />
                      ) : undefined
                    }
                  />
                ))}
              </ul>
            </section>
          ))
        )}
        {list.hasNextPage && (
          <div className="border-line border-t p-3 text-center">
            <button
              type="button"
              className={`${secondaryButton} h-9`}
              disabled={list.isFetchingNextPage}
              onClick={() => void list.fetchNextPage({ cancelRefetch: false })}
            >
              {list.isFetchingNextPage ? "載入中…" : "載入更多"}
            </button>
          </div>
        )}
        {list.isError && loaded.length > 0 && (
          <p
            role="alert"
            className="px-4 py-3 text-center text-ink-500 text-sm"
          >
            {list.error.message}
          </p>
        )}
      </>,
    );
  }

  return (
    <div
      data-notification-center={variant}
      className={`flex min-w-0 flex-col ${panel ? "gap-0" : "gap-3"}`}
    >
      {isLogin && (
        <div className={panel ? "border-line border-b px-4 py-3" : ""}>
          {controls}
        </div>
      )}
      {content}
    </div>
  );
}

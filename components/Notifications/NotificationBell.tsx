"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { TapScaleLink } from "@/components/mobile/TapScale";
import type { TNotification } from "@/interfaces/Notification";
import { formatUnread } from "@/modules/notifications/describe";
import {
  useMarkRead,
  useNotificationPreview,
  useUnreadCount,
} from "@/utils/useNotifications";
import { NotificationItem, NotificationSkeleton } from "./NotificationItem";

// The header bell (api-contract-v4 §2.1): the unread count, polled every
// 60 s while the tab is visible and on focus. Desktop opens a dropdown
// with the newest notifications; phones go to /notifications.

function bellLabel(unread: number) {
  return unread > 0 ? `通知，${formatUnread(unread)} 則未讀` : "通知";
}

function Badge({ unread }: { unread: number }) {
  if (unread <= 0) {
    return null;
  }
  return (
    <span
      aria-hidden
      data-unread-badge
      className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-danger-700 px-1 font-bold text-[11px] text-white leading-none"
    >
      {formatUnread(unread)}
    </span>
  );
}

/** Shows the count on the installed app's icon where supported. */
function useAppBadge(unread: number) {
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (count?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    const update =
      unread > 0 ? nav.setAppBadge?.(unread) : nav.clearAppBadge?.();
    update?.catch(() => {
      // Not installed / not allowed: nothing to show.
    });
  }, [unread]);
}

export function NotificationBell() {
  const { unread } = useUnreadCount();
  const [open, setOpen] = useState(false);
  const preview = useNotificationPreview(open);
  const markRead = useMarkRead();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  useAppBadge(unread);

  // Close on navigation, outside clicks and Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = preview.data?.items ?? [];

  function openItem(notification: TNotification) {
    if (!notification.read) {
      void markRead([notification]);
    }
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={bellLabel(unread)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        data-notification-bell
        onClick={() => setOpen((value) => !value)}
        className={`relative flex size-10 cursor-pointer items-center justify-center rounded-control border border-line text-ink-700 transition-colors hover:bg-field ${
          open ? "bg-field" : "bg-surface"
        }`}
      >
        <Bell size={20} aria-hidden />
        <Badge unread={unread} />
      </button>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="通知"
          className="absolute top-12 right-0 z-50 flex max-h-[min(34rem,calc(100dvh-6rem))] w-[24rem] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card-hover"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-line border-b px-4 py-3">
            <h2 className="font-bold text-base text-ink-900">通知</h2>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => void markRead("all")}
              className="cursor-pointer rounded-control px-2 py-1 font-semibold text-brand-700 text-sm transition-colors hover:bg-field disabled:cursor-default disabled:text-ink-400 disabled:hover:bg-transparent"
            >
              全部標為已讀
            </button>
          </div>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            {preview.isPending ? (
              <NotificationSkeleton rows={3} />
            ) : preview.isError && items.length === 0 ? (
              <div
                role="alert"
                className="flex flex-col items-center gap-2 px-4 py-8 text-center text-ink-500 text-sm"
              >
                <p>{preview.error.message}</p>
                <button
                  type="button"
                  className="cursor-pointer rounded-control border border-line px-3 py-1.5 text-ink-800 hover:bg-field"
                  onClick={() => void preview.refetch()}
                >
                  重試
                </button>
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-ink-500 text-sm">
                目前沒有通知
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <NotificationItem
                    key={item._id}
                    notification={item}
                    onOpen={openItem}
                    compact
                  />
                ))}
              </ul>
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block shrink-0 border-line border-t px-4 py-3 text-center font-semibold text-brand-700 text-sm transition-colors hover:bg-field"
          >
            查看全部通知
          </Link>
        </div>
      )}
    </div>
  );
}

/** Phones: the bell links to /notifications (hidden on that page). */
export function NotificationBellMobile({
  className = "",
}: {
  className?: string;
}) {
  const { unread } = useUnreadCount();
  const pathname = usePathname();
  useAppBadge(unread);

  if (pathname === "/notifications") {
    return null;
  }
  return (
    <TapScaleLink
      href="/notifications"
      aria-label={bellLabel(unread)}
      data-notification-bell
      className={`relative flex size-10 items-center justify-center rounded-control border border-line bg-surface text-ink-700 ${className}`}
      whileTap={{ scale: 0.92 }}
    >
      <Bell size={20} aria-hidden />
      <Badge unread={unread} />
    </TapScaleLink>
  );
}

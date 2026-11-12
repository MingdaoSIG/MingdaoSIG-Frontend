"use client";

import {
  Bell,
  CalendarDays,
  Check,
  Flag,
  GraduationCap,
  Heart,
  type LucideIcon,
  Megaphone,
  MessageCircle,
  ShieldAlert,
  UserPlus,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type {
  NotificationType,
  TNotification,
} from "@/interfaces/Notification";
import { imageUrl } from "@/modules/imageUrl";
import {
  describeNotification,
  notificationSentence,
  safeNotificationLink,
  systemKind,
} from "@/modules/notifications/describe";
import { relativeTime } from "@/modules/relativeTime";

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  comment: MessageCircle,
  reply: MessageCircle,
  like: Heart,
  join_request: UserPlus,
  join_result: Check,
  feedback: GraduationCap,
  event: CalendarDays,
  report_result: Flag,
  system: Bell,
};

function iconFor(notification: TNotification): LucideIcon {
  if (notification.type === "system") {
    const kind = systemKind(notification);
    return kind === "broadcast"
      ? Megaphone
      : kind === "account"
        ? ShieldAlert
        : Bell;
  }
  if (
    notification.type === "join_result" &&
    notification.meta?.accepted !== true
  ) {
    return X;
  }
  return TYPE_ICONS[notification.type] ?? Bell;
}

/** Actor avatar with the type as a small mark, or the type icon alone. */
function Picture({ notification }: { notification: TNotification }) {
  const Icon = iconFor(notification);
  const avatar = notification.actor ? imageUrl(notification.actor.avatar) : "";
  if (!avatar) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700">
        <Icon size={18} aria-hidden />
      </span>
    );
  }
  return (
    <span className="relative size-10 shrink-0">
      <Image
        src={avatar}
        alt=""
        width={40}
        height={40}
        className="size-10 rounded-full bg-field object-cover"
      />
      <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-surface bg-brand-700 text-white">
        <Icon size={10} strokeWidth={2.6} aria-hidden />
      </span>
    </span>
  );
}

/**
 * One notification. Opening it marks it read (`onOpen`) and follows its
 * link; an unread one has a tinted background and a dot.
 */
export function NotificationItem({
  notification,
  onOpen,
  compact = false,
}: {
  notification: TNotification;
  onOpen: (notification: TNotification) => void;
  /** The bell dropdown: tighter spacing. */
  compact?: boolean;
}) {
  const text = describeNotification(notification);
  const href = safeNotificationLink(notification.link);
  const unread = !notification.read;
  const className = `flex w-full cursor-pointer items-start gap-3 text-left transition-colors hover:bg-field ${
    compact ? "px-4 py-3" : "px-4 py-3.5 sm:px-5"
  } ${unread ? "bg-brand-50/55" : ""}`;

  const content = (
    <>
      <Picture
        notification={
          // An announcement shows its icon, not the sender's avatar.
          notification.type === "system"
            ? { ...notification, actor: null }
            : notification
        }
      />
      <span className="min-w-0 flex-1">
        {text.title ? (
          <>
            {text.source && (
              <span className="block text-brand-700 text-xs leading-5">
                {text.source}
              </span>
            )}
            <span className="block break-words font-semibold text-[0.9rem] text-ink-900 leading-6">
              {text.title}
            </span>
            {text.body && (
              <span
                className={`block whitespace-pre-line break-words text-[13px] text-ink-700 leading-5 ${
                  compact ? "line-clamp-2" : ""
                }`}
              >
                {text.body}
              </span>
            )}
          </>
        ) : (
          <span className="block text-[0.9rem] text-ink-800 leading-6">
            {text.actor && (
              <span className="font-semibold text-ink-900">{text.actor}</span>
            )}
            {text.action}
          </span>
        )}
        {text.detail && (
          <span className="block truncate text-[13px] text-ink-500 leading-5">
            {text.detail}
          </span>
        )}
        <time
          dateTime={notification.createdAt}
          className={`mt-0.5 block text-xs ${
            unread ? "font-semibold text-brand-700" : "text-ink-500"
          }`}
        >
          {relativeTime(notification.createdAt)}
        </time>
      </span>
      {unread && (
        <span className="mt-2 size-2.5 shrink-0 rounded-full bg-brand-700">
          <span className="sr-only">未讀</span>
        </span>
      )}
    </>
  );

  const label = `${notificationSentence(notification)}${unread ? "（未讀）" : ""}`;

  return (
    <li data-notification-id={notification._id} data-unread={unread}>
      {href ? (
        <Link
          href={href}
          aria-label={label}
          className={className}
          onClick={() => onOpen(notification)}
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          aria-label={label}
          className={className}
          onClick={() => onOpen(notification)}
        >
          {content}
        </button>
      )}
    </li>
  );
}

export function NotificationSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul aria-hidden className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => `skeleton-${i}`).map((key) => (
        <li key={key} className="flex animate-pulse gap-3 px-4 py-3.5">
          <span className="size-10 shrink-0 rounded-full bg-field" />
          <span className="flex flex-1 flex-col gap-2">
            <span className="h-4 w-3/4 rounded-chip bg-field" />
            <span className="h-3 w-1/2 rounded-chip bg-field" />
          </span>
        </li>
      ))}
    </ul>
  );
}

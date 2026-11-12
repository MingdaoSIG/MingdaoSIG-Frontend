import type { TNotification } from "@/interfaces/Notification";

// How a notification reads in the bell and on /notifications. The backend
// stores facts (type, actor, target label, meta); the sentence is built
// here, in Traditional Chinese.

export type NotificationText = {
  /** Who did it, shown in bold; empty for system notifications. */
  actor: string;
  /** The rest of the sentence after the actor. */
  action: string;
  /** Second line: post title, SIG name… */
  detail: string;
};

function count(notification: TNotification) {
  const value = notification.meta?.count;
  return typeof value === "number" && value > 1 ? value : 1;
}

/** 「和其他 2 人」 when several people did the same thing (collapsed). */
function others(notification: TNotification) {
  const n = count(notification);
  return n > 1 ? ` 和其他 ${n - 1} 人` : "";
}

export function describeNotification(
  notification: TNotification,
): NotificationText {
  const actor = notification.actor?.name?.trim() || "";
  const label = notification.target?.label?.trim() || "";
  const who = actor || "有人";

  switch (notification.type) {
    case "comment":
      return { actor: who, action: " 留言了你的貼文", detail: label };
    case "reply":
      return { actor: who, action: " 回覆了你的留言", detail: label };
    case "like":
      return {
        actor: who,
        action: `${others(notification)} 對你的貼文按讚`,
        detail: label,
      };
    case "join_request":
      return {
        actor: who,
        action: `${others(notification)} 申請加入 SIG`,
        detail: label,
      };
    case "join_result": {
      const accepted = notification.meta?.accepted === true;
      return {
        actor: "",
        action: accepted ? "你的入社申請已通過" : "你的入社申請沒有通過",
        detail: label,
      };
    }
    case "feedback":
      return { actor: who, action: " 給了你的貼文老師回饋", detail: label };
    case "event":
      return {
        actor: "",
        action: "你的 SIG 有新活動",
        detail: label,
      };
    case "report_result":
      return { actor: "", action: "你的檢舉已處理", detail: label };
    default:
      return { actor: "", action: label || "你有一則新通知", detail: "" };
  }
}

/** Plain sentence, for aria-labels. */
export function notificationSentence(notification: TNotification) {
  const text = describeNotification(notification);
  const sentence = `${text.actor}${text.action}`.trim();
  return text.detail ? `${sentence}：${text.detail}` : sentence;
}

/**
 * Only same-site paths are followed (`link` is a frontend path); anything
 * else, such as `//evil.example` or `javascript:`, gives null.
 */
export function safeNotificationLink(link: unknown): string | null {
  if (typeof link !== "string") {
    return null;
  }
  if (!link.startsWith("/") || link.startsWith("//") || link.includes("\\")) {
    return null;
  }
  return link;
}

/** 「99+」 above 99, for the bell badge. */
export function formatUnread(unread: number) {
  return unread > 99 ? "99+" : String(unread);
}

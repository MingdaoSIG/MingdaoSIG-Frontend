import { announcementSigId } from "@/components/Threads/configs/announcement";
import type { Sig } from "@/interfaces/Sig";
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";

// Guards for post list items. The backend populates `user` and `sig` as
// `{ _id, name }` (toPostListItems); an older or broken item may carry an
// id string or nothing, and the card must still render.

/** Populated object, or null for a missing / unpopulated reference. */
export function asObject<T>(value: unknown): T | null {
  return typeof value === "object" && value !== null ? (value as T) : null;
}

/** Only well-formed posts are rendered; anything else is skipped. */
export function isThread(value: unknown): value is TThread {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TThread)._id === "string"
  );
}

export function postSigOf(post: TThread) {
  return asObject<Pick<Sig, "_id" | "name" | "color" | "customId">>(post.sig);
}

export function postAuthorOf(post: TThread) {
  return asObject<Pick<User, "_id" | "name" | "customId">>(post.user);
}

export function isAnnouncementPost(post: TThread) {
  const sig = postSigOf(post);
  return (sig?._id ?? post.sig) === announcementSigId;
}

/**
 * Card time: 「3 小時前」 within a week, then 「9/15」 this year and
 * 「2025/9/15」 before. Empty for a missing or broken date.
 */
export function cardTime(value: string | undefined, now: number = Date.now()) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const time = date.getTime();
  if (Number.isNaN(time)) {
    return "";
  }
  const minutes = Math.floor((now - time) / 60000);
  if (minutes < 1) {
    return "剛剛";
  }
  if (minutes < 60) {
    return `${minutes} 分鐘前`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} 小時前`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} 天前`;
  }
  const md = `${date.getMonth() + 1}/${date.getDate()}`;
  return date.getFullYear() === new Date(now).getFullYear()
    ? md
    : `${date.getFullYear()}/${md}`;
}

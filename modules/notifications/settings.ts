import type {
  NotificationSettings,
  NotificationSettingsPatch,
  PushNotificationType,
} from "@/interfaces/Notification";
import type { User } from "@/interfaces/User";

// `user.notificationSettings` (api-contract-v4 §2.2). Missing keys mean
// the defaults below. `email.comment` is the older `notifyComments`, so a
// profile without the new field still shows the right switch. The weekly
// digest is opt-in.

export const PUSH_TYPES: PushNotificationType[] = [
  "comment",
  "reply",
  "like",
  "join_request",
  "join_result",
  "feedback",
  "event",
];

export function defaultNotificationSettings(): NotificationSettings {
  return {
    push: {
      comment: true,
      reply: true,
      like: true,
      join_request: true,
      join_result: true,
      feedback: true,
      event: true,
    },
    email: { comment: true, digest: false },
  };
}

function flag(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

/** The user's settings with every key filled in. */
export function resolveNotificationSettings(
  user: Pick<User, "notificationSettings" | "notifyComments"> | null,
): NotificationSettings {
  const settings = defaultNotificationSettings();
  const saved = user?.notificationSettings;
  for (const type of PUSH_TYPES) {
    settings.push[type] = flag(saved?.push?.[type], settings.push[type]);
  }
  settings.email.comment = flag(
    saved?.email?.comment,
    flag(user?.notifyComments, true),
  );
  settings.email.digest = flag(saved?.email?.digest, false);
  return settings;
}

/** Deep-merges a saved change into the profile's settings. */
export function mergeNotificationSettings(
  current: NotificationSettingsPatch | undefined,
  patch: NotificationSettingsPatch,
): NotificationSettingsPatch {
  return {
    push: { ...current?.push, ...patch.push },
    email: { ...current?.email, ...patch.email },
  };
}

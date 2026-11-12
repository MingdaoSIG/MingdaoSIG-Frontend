// In-app notifications, web push and notification settings
// (api-contract-v4 §2).

export type NotificationType =
  | "comment"
  | "reply"
  | "like"
  | "join_request"
  | "join_result"
  | "feedback"
  | "event"
  | "report_result"
  | "system";

export type NotificationActor = {
  _id: string;
  name?: string;
  customId?: string;
  avatar?: string;
};

export type TNotification = {
  _id: string;
  type: NotificationType;
  /** Public fields of whoever caused it; null for system notifications. */
  actor: NotificationActor | null;
  target: { kind: string; id: string; label?: string };
  /** Frontend path to open, e.g. "/post/<id>". */
  link: string;
  /** Small facts for rendering: `count` (collapsed likes), `accepted`… */
  meta?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

/** Push types the user can turn off one by one. */
export type PushNotificationType =
  | "comment"
  | "reply"
  | "like"
  | "join_request"
  | "join_result"
  | "feedback"
  | "event"
  /** Announcements and broadcasts (contract v4 §5.5). */
  | "system";

export type NotificationSettings = {
  push: Record<PushNotificationType, boolean>;
  email: { comment: boolean; digest: boolean };
};

/** What `POST /user` takes and the profile may hold: any subset. */
export type NotificationSettingsPatch = {
  push?: Partial<Record<PushNotificationType, boolean>>;
  email?: Partial<NotificationSettings["email"]>;
};

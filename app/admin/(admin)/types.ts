// Shapes of the admin API (design/api-contract-v3.md §3). Every field the
// backend may leave out (a deleted author, an old document) is optional,
// and the pages show a placeholder instead of failing.

import type { Identity } from "@/interfaces/User";
import type { Suspension } from "@/modules/suspension";

/** A badge key (contract v4 §5.9: any key of the badge collection). */
export type BadgeId = string;

export type UserRef = {
  _id: string;
  name?: string;
  customId?: string;
  avatar?: string;
};

export type Overview = {
  users: { total: number; last7d: number };
  posts: { total: number; last7d: number };
  comments: { total: number; last7d: number };
  pendingJoinRequests: { total: number; oldestCreatedAt: string | null };
  sigsWithoutLeader: { _id: string; name: string; customId?: string }[];
  sigsWithoutModerator: { _id: string; name: string; customId?: string }[];
  recentPosts: {
    _id: string;
    title: string;
    sig: string;
    user: UserRef | null;
    createdAt: string;
  }[];
  /** Open reports (contract v4 §4.6); older backends leave it out. */
  openReports?: number;
};

export type PostStatus = "active" | "removed" | "pinned" | "all";
export type PostSort = "newest" | "oldest" | "likes";
export type PostBatchAction = "pin" | "unpin" | "remove" | "restore";

export type AdminPost = {
  _id: string;
  title: string;
  sig: string;
  user: UserRef | null;
  createdAt?: string;
  updatedAt?: string;
  pinned?: boolean;
  removed?: boolean;
  likes?: number;
  comments?: number;
};

export type AdminUser = {
  _id: string;
  name?: string;
  customId?: string;
  email?: string;
  code?: string;
  class?: string;
  identity?: Identity;
  avatar?: string;
  permission?: number;
  /** From the permission (contract v4 §5.2); older backends leave it out. */
  role?: UserRole;
  badge?: BadgeId[];
  sig?: string[];
  /** A mute or ban in force, else null or absent (contract v4 §5.1). */
  suspension?: Suspension | null;
  createdAt?: string;
};

/** `permission` 1, 3 and 2 (contract v4 §5.2). */
export type UserRole = "user" | "moderator" | "admin";

export type AdminUserDetail = AdminUser & {
  description?: string;
  displayName?: string;
  previousCustomIds?: string[];
  postCount?: number;
  commentCount?: number;
  managedSigs?: { _id: string; name: string; role: "leader" | "moderator" }[];
  sigs?: { _id: string; name: string }[];
};

export type CommentStatus = "active" | "removed" | "all";

export type AdminComment = {
  _id: string;
  content: string;
  post: { _id: string; title?: string } | null;
  user: UserRef | null;
  /** The parent comment id for a reply; empty for a top-level comment. */
  reply?: string | null;
  createdAt?: string;
  updatedAt?: string;
  removed?: boolean;
};

export type AdminSig = {
  _id: string;
  name: string;
  customId?: string;
  avatar?: string;
  description?: string;
  memberCount?: number;
  leaders: UserRef[];
  moderators: UserRef[];
  pendingJoinRequests?: number;
  /** `#rrggbb` (contract v4 §3.7). */
  color?: string;
  /** Image id of the default post cover. */
  defaultCover?: string;
  /** Listed by `?archived=1`. */
  archived?: boolean;
  previousCustomIds?: string[];
  /** A Discord webhook is set (contract v4 §3.6); never the URL itself. */
  discordWebhookSet?: boolean;
};

export type JoinState = "pending" | "accepted" | "rejected";
export type JoinStatusFilter = JoinState | "all";

export type JoinRequest = {
  _id: string;
  user:
    | (UserRef & {
        class?: string;
      })
    | null;
  sig: { _id: string; name?: string } | null;
  q1?: string;
  q2?: string;
  q3?: string;
  /** Labelled answers (contract v4 §5.6); older requests get q1..q3. */
  answers?: { question: string; answer: string }[];
  /** Why the platform decided it (e.g. a SIG merge). */
  note?: string;
  state: JoinState;
  createdAt?: string;
  updatedAt?: string;
};

export type AuditAction =
  | "post.pin"
  | "post.unpin"
  | "post.remove"
  | "post.restore"
  | "comment.remove"
  | "comment.restore"
  | "user.permission"
  | "user.badges"
  | "sig.update"
  | "sig.leader.add"
  | "sig.leader.remove"
  | "sig.moderator.add"
  | "sig.moderator.remove"
  | "sig.member.remove"
  | "join.accept"
  | "join.reject"
  | "post.move"
  | "sig.merge"
  | "rollover.apply"
  | "user.update"
  | "badge.update"
  | "user.suspend"
  | "user.unsuspend"
  | "banner.update"
  | "broadcast.send"
  | "keyword.update";

export type AuditTargetKind =
  | "post"
  | "comment"
  | "user"
  | "sig"
  | "join"
  | "badge"
  | "site"
  | "banner"
  | "broadcast"
  | "setting";

export type AuditEntry = {
  _id: string;
  actor: UserRef | null;
  action: AuditAction | string;
  target: { kind: AuditTargetKind | string; id: string; label?: string };
  meta?: Record<string, unknown>;
  createdAt?: string;
};

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "privacy"
  | "other";
export type ReportStatus = "open" | "resolved" | "dismissed";
export type ReportStatusFilter = ReportStatus | "all";
export type ReportKind = "post" | "comment";
export type ReportAction = "remove" | "dismiss";

export type ReportTarget = {
  kind: ReportKind;
  id: string;
  /** A post's title. */
  title?: string;
  /** The start of a comment. */
  excerpt?: string;
  author?: { _id: string; name?: string } | null;
  removed?: boolean;
  /** For a comment, the post it sits under, if the backend sends it. */
  post?: string | { _id: string; title?: string } | null;
  postId?: string;
};

/** A report as `GET /admin/reports` returns it (contract v4 §4.6). */
export type AdminReport = {
  _id: string;
  /**
   * Who reported it; the keyword filter (contract v4 §5.11) files them as
   * `"system"` (or `{ _id: "system" }`).
   */
  reporter: UserRef | "system" | null;
  target: ReportTarget;
  reason: ReportReason | string;
  note?: string;
  status: ReportStatus;
  handledBy?: UserRef | string | null;
  /** The admin who handled it, resolved to public fields. */
  handledByUser?: UserRef | null;
  resolution?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** A member as `GET /sig/:sigId/members` returns it. */
export type SigMember = {
  _id: string;
  code?: string;
  name?: string;
  email?: string;
  class?: string;
  customId?: string;
  identity?: Identity;
  avatar?: string;
};

export type ListPage<T> = { items: T[]; total: number };

// ---- SIG administration (contract v4 §5.7–§5.9) ---------------------------

export type SigRef = { _id: string; name?: string; customId?: string };

/** `POST /admin/posts/move` (dry run or applied). */
export type MovePostsResult = {
  dryRun: boolean;
  /** Posts that move (dry run) or moved. */
  count: number;
  /** Of those, posts whose old default cover becomes the target's. */
  covers?: number;
  from?: string | string[];
  to: string;
};

/** `POST /admin/sigs/:id/merge` (dry run or applied). */
export type MergeResult = {
  dryRun: boolean;
  source: SigRef;
  into: SigRef;
  posts: number;
  covers?: number;
  members: {
    added: number;
    alreadyInTarget: number;
    removedFromSource: number;
  };
  joinRequests: { moved: number; rejected: number };
  previousCustomIds: string[];
  /** Reported, not moved. */
  leaders: UserRef[];
  moderators: UserRef[];
  archived?: boolean;
};

export type RolloverPerson = UserRef & { class?: string };

/** `GET /admin/rollover/preview`. */
export type RolloverPreview = {
  alumniMembers: {
    users: number;
    memberships: number;
    bySig: { sig: SigRef & { archived?: boolean }; count: number }[];
    list: (RolloverPerson & { sigs: string[] })[];
  };
  alumniManagers: {
    user: RolloverPerson;
    sig: SigRef;
    role: "leader" | "moderator";
  }[];
};

/** `POST /admin/rollover/apply`. */
export type RolloverResult = {
  dryRun: boolean;
  removeAlumniFromSigs: boolean;
  removeAlumniLeaders: boolean;
  users: number;
  memberships: number;
  leadersRemoved: number;
  moderatorsRemoved: number;
};

/** One SIG of `POST /admin/sigs/leaders/batch`. */
export type LeaderBatchItem = {
  sig: string;
  added: UserRef[];
  removed: UserRef[];
  leaders: UserRef[];
  applied: boolean;
};

export type LeaderBatchResult = {
  dryRun: boolean;
  added: number;
  removed: number;
  results: LeaderBatchItem[];
};

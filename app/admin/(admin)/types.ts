// Shapes of the admin API (design/api-contract-v3.md §3). Every field the
// backend may leave out (a deleted author, an old document) is optional,
// and the pages show a placeholder instead of failing.

import type { Identity } from "@/interfaces/User";

export type BadgeId = "developer" | "10.21_user" | "bug_hunter";

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
  badge?: BadgeId[];
  sig?: string[];
  createdAt?: string;
};

export type AdminUserDetail = AdminUser & {
  description?: string;
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
  | "join.reject";

export type AuditTargetKind = "post" | "comment" | "user" | "sig" | "join";

export type AuditEntry = {
  _id: string;
  actor: UserRef | null;
  action: AuditAction | string;
  target: { kind: AuditTargetKind | string; id: string; label?: string };
  meta?: Record<string, unknown>;
  createdAt?: string;
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

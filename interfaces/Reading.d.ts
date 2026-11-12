// Shapes of contract v4 §4 (author stats, series, cloud drafts, reports).
// Fields the backend may leave out are optional; the UI shows a fallback.

import type { TThread } from "./Thread";

export type TAuthorStats = {
  totals: { posts: number; views: number; likes: number; comments: number };
  daily: { date: string; views: number }[];
  posts: {
    _id: string;
    title: string;
    createdAt?: string;
    views: number;
    likes: number;
    comments: number;
    viewsInRange: number;
  }[];
};

export type TSeriesUser = {
  _id: string;
  name?: string;
  customId?: string;
  avatar?: string;
};

/** `GET /series/:id`: posts are list items, in order. */
export type TSeries = {
  _id: string;
  title: string;
  description?: string;
  user?: TSeriesUser | string | null;
  /** List items from `GET /series/:id`; ids in `GET /user/:id/series`. */
  posts: (TThread | string)[];
  /** `GET /user/:id/series`: how many visible posts, and the first cover. */
  postCount?: number;
  cover?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TDraftFields = {
  title: string;
  sig: string;
  content: string;
  cover: string;
  hashtag: string[];
  /** The post being edited, or null for a new post. */
  post: string | null;
};

export type TDraft = TDraftFields & {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
};

/** `GET /draft` items: no `content`, an `excerpt` instead. */
export type TDraftSummary = Omit<TDraft, "content"> & { excerpt?: string };

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "privacy"
  | "other";

export type ReportTarget = { kind: "post" | "comment"; id: string };

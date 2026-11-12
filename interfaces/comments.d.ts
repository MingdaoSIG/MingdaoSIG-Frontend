export type TCommentUser = {
  _id?: string;
  customId?: string;
  avatar?: string;
  name?: string;
};

export type TComments = {
  _id: string;
  /** Populated author; null when the author was deleted. */
  user: TCommentUser | null;
  post: string;
  content: string;
  like?: string[];
  /** Parent comment id; "" (or null) for a top-level comment. */
  reply: string | null;
  removed?: boolean;
  createdAt: string;
  updatedAt?: string;
  /** `updatedAt` is more than 5 s after `createdAt` (set by the backend). */
  edited?: boolean;
  /** Top-level comments only: replies, oldest first. */
  replies?: TComments[];
  replyCount?: number;
  __v?: number;
};

export type TComments = {
  _id: string;
  /** Populated author; null when the author was deleted. */
  user: {
    customId?: string;
    avatar?: string;
  } | null;
  post: string;
  content: string;
  like: Array;
  reply: string;
  removed: boolean;
  createdAt: Date;
  updateAt: Date;
  __v: string;
};

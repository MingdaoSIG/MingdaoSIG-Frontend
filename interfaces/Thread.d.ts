export type TThread = {
  _id?: string;
  sig: string;
  title: string;
  cover: string;
  content: string;
  /** Plain-text summary (~200 chars) the backend adds to list items. */
  excerpt?: string;
  user: string;
  hashtag?: string[];
  like?: string[];
  likes?: number;
  comments?: number;
  priority?: number;
  pinned?: boolean;
  removed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

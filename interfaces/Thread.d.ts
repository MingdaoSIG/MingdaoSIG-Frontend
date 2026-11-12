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
  /** Read count (contract v4 §4.1); absent on an older backend. */
  views?: number;
  /** `GET /post/:id` only: the series this post belongs to (§4.4). */
  series?: TPostSeries[];
  priority?: number;
  pinned?: boolean;
  removed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

/** A series a post is in, with its neighbours (`GET /post/:id`). */
export type TPostSeries = {
  _id: string;
  title: string;
  /** 0-based position of this post in the series. */
  index: number;
  total: number;
  prev: { _id: string; title: string } | null;
  next: { _id: string; title: string } | null;
};

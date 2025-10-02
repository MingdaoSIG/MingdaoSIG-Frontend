export type TThread = {
  _id?: string;
  sig: string;
  title: string;
  cover: string;
  content: string;
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

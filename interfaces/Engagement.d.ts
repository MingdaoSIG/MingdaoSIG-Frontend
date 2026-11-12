// Portfolio, teacher feedback, SIG events, showcase and analytics
// (design/api-contract-v4.md §3.1–§3.5).

/** A SIG event (活動與社課) as every event route returns it. */
export type TSigEvent = {
  _id: string;
  sig: string;
  title: string;
  description: string;
  location: string;
  /** ISO dates. An event is past only once `endAt` has passed. */
  startAt: string;
  endAt: string;
  /** 0 means unlimited. */
  capacity: number;
  rsvpOpen: boolean;
  rsvpCount: number;
  /** Present only when the request carried a JWT. */
  rsvpedByMe?: boolean;
};

/** The fields a manager sends to create or edit an event. */
export type TSigEventInput = {
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  capacity: number;
  rsvpOpen: boolean;
};

/** One row of `GET /event/:id/rsvps` (managers and admins). */
export type TEventRsvp = {
  user: { _id: string; name: string; customId: string; class: string };
  createdAt: string;
};

/** Teacher feedback (老師回饋) on a post, `GET /post/:id/feedback`. */
export type TFeedback = {
  _id: string;
  content: string;
  author: { _id: string; name: string; customId: string; avatar: string };
  createdAt: string;
  updatedAt: string;
};

export type TPortfolioRole = "member" | "leader" | "moderator";

/** `GET /user/me/portfolio` (學習歷程). */
export type TPortfolio = {
  user: {
    name: string;
    customId: string;
    class: string;
    identity: string;
    avatar: string;
  };
  posts: TPortfolioPost[];
  sigs: {
    _id: string;
    name: string;
    joinedAt: string | null;
    roles: TPortfolioRole[];
  }[];
  totals: { posts: number; likes: number; comments: number; views: number };
  generatedAt: string;
};

export type TPortfolioPost = {
  _id: string;
  title: string;
  sig: { _id: string; name: string };
  createdAt: string;
  likes: number;
  comments: number;
  views: number;
  excerpt?: string;
  feedback: {
    _id: string;
    content: string;
    author: { name: string };
    createdAt: string;
  }[];
};

/** A post of a SIG's showcase (精選成果), resolved by the SIG reads. */
export type TFeaturedPost = {
  _id: string;
  title: string;
  cover: string;
  excerpt?: string;
  createdAt?: string;
  likes?: number;
  views?: number;
  comments?: number;
  user?: { _id?: string; name?: string };
  sig?: { _id?: string; name?: string };
};

/** `GET /sig/:id/analytics?months=` (managers and admins). */
export type TSigAnalytics = {
  members: { current: number; byMonth: { month: string; joined: number }[] };
  posts: { byMonth: { month: string; count: number }[]; total: number };
  topPosts: {
    _id: string;
    title: string;
    likes: number;
    comments: number;
    views: number;
  }[];
  topAuthors: {
    user: { _id: string; name: string; customId: string };
    posts: number;
  }[];
  events: { upcoming: number; past: number; rsvps: number };
};

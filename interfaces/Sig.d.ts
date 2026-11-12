/** One question of a SIG's join form (contract v4 §5.6). */
export type SigJoinQuestion = {
  label: string; // 題目（1–60 字）
  required: boolean; // 必填
};

/** A SIG's recruiting settings (contract v4 §5.6). */
export type SigRecruiting = {
  open: boolean; // 招生中
  message?: string; // 招生說明（≤200 字）
  until?: string | null; // 截止時間（ISO；null 為不限）
};

export type Sig = {
  _id: string; // ID
  name: string; // sig 名稱
  description?: string; // 描述
  avatar?: string; // 大頭貼
  follower?: string[]; // 追隨者
  customId?: string; // 自定義ID
  moderator?: string[]; // 管理者
  leader?: string[]; // 領導者
  removed?: boolean; // 刪除
  badge?: string[]; // 徽章
  /** Accent colour `#rrggbb` (contract v4 §3.7). */
  color?: string;
  /** Image id of the cover for posts without one. */
  defaultCover?: string;
  /** Earlier customIds; `/@<old>` redirects to the current one. */
  previousCustomIds?: string[];
  /** Set when the lookup matched an old customId: the current one. */
  redirectTo?: string;
  /** The join form's questions, with the defaults filled in. */
  joinQuestions?: SigJoinQuestion[];
  recruiting?: SigRecruiting;
};

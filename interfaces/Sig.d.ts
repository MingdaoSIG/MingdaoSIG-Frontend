export type Sig = {
  _id?: string, // ID
  name?: string, // sig 名稱
  description?: string, // 描述
  avatar?: string, // 大頭貼
  badge?: ("developer" | "10.21_user")[], // 徽章
  follower?: string[], // 追隨者
  customId?: string, // 自定義ID
  moderator?: string[], // 管理者
  leader?: string[], // 領導者
  removed?: boolean, // 刪除
}

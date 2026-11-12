import type { Suspension } from "@/modules/suspension";
import type { NotificationSettingsPatch } from "./Notification";

export type Identity = "teacher" | "student" | "alumni";

/*
0:view
1:like, comment, request join
2:add new thread (SIG)
3:add new thread (ALL)
4:delete member
5:review member request
6:delete comment
7:manage member permission
8:manage thread

0:view
1:like, manage own comment
2:manage own thread thread (SIG)
3:manage own thread (ALL)
4:manage SIG member
5:manage others comment
6:manage others thread
7:manage all
*/
export type Permission = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type User = {
  _id?: string; // ID
  customId?: string; // 自定義ID
  email?: string; // 帳號
  name?: string; // 姓名
  code?: string; // 學號
  class?: string; // 班級
  identity?: Identity; // 老師或學生
  sig?: string[]; // SIG
  displayName?: string; // 顯示名稱
  description?: string; // 描述
  avatar?: string; // 大頭貼
  /** Badge keys (contract v4 §5.9: any key of `GET /badge/list`). */
  badge?: string[]; // 徽章
  follower?: string[]; // 追隨者
  permission?: Permission; // 權限
  /** Email me when someone comments (only on /user/me and /login). */
  notifyComments?: boolean;
  /**
   * Push and email preferences (only on /user/me and /login). Missing
   * keys mean the defaults; see modules/notifications/settings.
   */
  notificationSettings?: NotificationSettingsPatch;
  /** Set when `/user/@:id` matched an old customId: the current one. */
  redirectTo?: string;
  /**
   * A mute or ban in force (only on /user/me and /login, contract v4
   * §5.1); absent otherwise.
   */
  suspension?: Suspension;
  /** SIGs the user follows (contract v4 §6.1; only on `GET /user/me`). */
  followedSigs?: string[];
  /**
   * When the first-login onboarding was finished or skipped (§6.2; only
   * on `GET /user/me` and `POST /user`). Null: show the onboarding.
   */
  onboardedAt?: string | null;
  /**
   * The user's own order of their SIGs in the side rail and the 我的 hub
   * (`POST /user { sigOrder }`, `GET /user/me`); ids not in it go last.
   */
  sigOrder?: string[];
  createAt?: string; // 建立時間
  updateAt?: string; // 更新時間
  __v?: number; // 版本
};

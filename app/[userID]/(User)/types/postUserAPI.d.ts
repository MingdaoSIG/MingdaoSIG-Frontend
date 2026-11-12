import type { NotificationSettingsPatch } from "@/interfaces/Notification";

/**
 * Body of `POST /user` (your own profile).
 *
 * @property {string} description - The bio shown on the profile.
 * @property {boolean} notifyComments - Email me when someone comments.
 * @property {NotificationSettingsPatch} notificationSettings - Push and
 * email preferences; only the keys given change (api-contract-v4 §2.2).
 */
export type TPostUserAPI = {
  description?: string;
  notifyComments?: boolean;
  notificationSettings?: NotificationSettingsPatch;
};

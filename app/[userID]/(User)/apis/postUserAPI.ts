// Types
import type { TPostUserAPI } from "@/app/[userID]/(User)/types/postUserAPI";
import { apiRequest } from "@/modules/api/client";

/** Updates your own profile; only the fields given are sent. */
export function postUser(
  { description, notifyComments, notificationSettings }: TPostUserAPI,
  token: string,
) {
  const body: Record<string, unknown> = {};
  if (description !== undefined) {
    body.description = description.toString();
  }
  if (notifyComments !== undefined) {
    body.notifyComments = notifyComments;
  }
  if (notificationSettings !== undefined) {
    body.notificationSettings = notificationSettings;
  }
  return apiRequest("/user", {
    method: "POST",
    token,
    body,
  });
}

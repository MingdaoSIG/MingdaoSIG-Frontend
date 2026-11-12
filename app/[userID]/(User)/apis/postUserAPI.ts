// Types
import type { TPostUserAPI } from "@/app/[userID]/(User)/types/postUserAPI";
import { apiRequest } from "@/modules/api/client";

export function postUser({ description }: TPostUserAPI, token: string) {
  return apiRequest("/user", {
    method: "POST",
    token,
    body: { description: description?.toString() },
  });
}

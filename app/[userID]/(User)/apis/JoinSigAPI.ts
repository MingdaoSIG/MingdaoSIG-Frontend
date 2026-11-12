import type { TJoinSigAPI } from "@/app/[userID]/(User)/types/joinSigAPI";
import { apiRequest } from "@/modules/api/client";

/** Apply to join; 403/4040 when the SIG is not recruiting. */
export function JoinSigAPI({ sig, answers }: TJoinSigAPI, token: string) {
  return apiRequest(`/sig/${sig}/join`, {
    method: "POST",
    token,
    body: { answers },
  });
}

export function ReadJoinSigAPI(
  sig: string,
  token: string,
  signal?: AbortSignal,
) {
  return apiRequest<{ state?: string }>(`/sig/${sig}/join`, {
    token,
    signal,
  });
}

/** Leave a SIG you are a member of (contract v3 §3.5). */
export function LeaveSigAPI(sig: string, token: string | null) {
  return apiRequest<{ sig?: string; user?: string }>(`/sig/${sig}/members/me`, {
    method: "DELETE",
    token,
  });
}

/** Edit a SIG you manage: its description and/or avatar (an image id). */
export function UpdateSigAPI(
  sig: string,
  body: { description?: string; avatar?: string },
  token: string | null,
) {
  return apiRequest<Record<string, unknown>>(`/sig/${sig}`, {
    method: "POST",
    token,
    body,
  });
}

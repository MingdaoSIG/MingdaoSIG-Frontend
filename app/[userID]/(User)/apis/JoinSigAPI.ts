import type { TJoinSigAPI } from "@/app/[userID]/(User)/types/joinSigAPI";
import { apiRequest } from "@/modules/api/client";

export function JoinSigAPI({ sig, q1, q2, q3 }: TJoinSigAPI, token: string) {
  return apiRequest(`/sig/${sig}/join`, {
    method: "POST",
    token,
    body: { q1, q2, q3 },
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

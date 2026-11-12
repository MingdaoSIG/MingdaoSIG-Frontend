import type { TFeedback } from "@/interfaces/Engagement";
import { type ApiFailure, apiRequest } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";

// Teacher feedback (老師回饋, design/api-contract-v4.md §3.2). Private to
// the post's author, the moderators (指導老師) of the post's SIG and
// admins; SIG leaders cannot read or write it. Only its author edits a
// piece of feedback; its author or an admin deletes it.

export const FEEDBACK_MAX = 1000;

function isFeedback(value: unknown): value is TFeedback {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TFeedback)._id === "string" &&
    typeof (value as TFeedback).content === "string"
  );
}

export function feedbackOf(value: unknown): TFeedback | null {
  return isFeedback(value) ? value : null;
}

export async function fetchFeedback(postId: string, signal?: AbortSignal) {
  const result = await apiRequest<TFeedback[]>(
    `/post/${encodeURIComponent(postId)}/feedback`,
    { auth: true, signal },
  );
  if (!result.ok) {
    return result;
  }
  const items = Array.isArray(result.data)
    ? result.data.filter(isFeedback)
    : [];
  return { ...result, data: items };
}

export function createFeedback(postId: string, content: string) {
  return apiRequest<TFeedback>(`/post/${encodeURIComponent(postId)}/feedback`, {
    method: "POST",
    body: { content },
    auth: true,
  });
}

export function editFeedback(id: string, content: string) {
  return apiRequest<TFeedback>(`/feedback/${encodeURIComponent(id)}`, {
    method: "POST",
    body: { content },
    auth: true,
  });
}

export function removeFeedback(id: string) {
  return apiRequest<{ _id: string; removed: true }>(
    `/feedback/${encodeURIComponent(id)}`,
    { method: "DELETE", auth: true },
  );
}

/** Code points, the way the backend counts. */
export function feedbackLength(value: string) {
  return Array.from(value).length;
}

export function feedbackFailureMessage(failure: ApiFailure) {
  if (failure.status === CustomStatus.EMPTY_CONTENT) {
    return "回饋內容不能空白";
  }
  if (failure.status === CustomStatus.INVALID_CONTENT_LENGTH) {
    return `回饋最多 ${FEEDBACK_MAX} 字`;
  }
  if (failure.status === CustomStatus.FORBIDDEN) {
    return "只有這個 SIG 的指導老師或管理員可以給回饋，回饋也只能由寫的人修改";
  }
  if (failure.kind === "not-found") {
    return "這則回饋或貼文已經不存在";
  }
  return failure.message;
}

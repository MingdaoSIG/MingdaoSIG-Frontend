import type { TComments } from "@/interfaces/comments";
import type { TThread } from "@/interfaces/Thread";
import { type ApiFailure, apiRequest } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";

/** The backend rejects longer comments (4023). */
export const COMMENT_MAX_LENGTH = 250;

/** `updatedAt` this long after `createdAt` counts as an edit. */
const EDITED_AFTER_MS = 5000;

/** New comment; `reply` is the top-level comment it answers, or "". */
export function PostCommentAPI(
  post: string | undefined,
  reply: string,
  content: string,
  token: string | null,
) {
  return apiRequest<TComments>("/comment", {
    method: "POST",
    token,
    body: { post, reply, content },
  });
}

/** Edits your own comment. */
export function EditCommentAPI(
  commentId: string,
  content: string,
  token: string | null,
) {
  return apiRequest<TComments>(`/comment/${commentId}`, {
    method: "POST",
    token,
    body: { content },
  });
}

/** Deletes (hides) a comment: yours, or any on a SIG you manage. */
export function DeleteCommentAPI(commentId: string, token: string | null) {
  return apiRequest(`/comment/${commentId}`, { method: "DELETE", token });
}

function isComment(item: unknown): item is TComments {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof (item as TComments)._id === "string"
  );
}

/** Drops malformed items, and malformed replies inside the good ones. */
function cleanComments(list: unknown): TComments[] {
  if (!Array.isArray(list)) {
    return [];
  }
  return list.filter(isComment).map((comment) => ({
    ...comment,
    replies: Array.isArray(comment.replies)
      ? comment.replies.filter(isComment)
      : [],
  }));
}

/**
 * Top-level comments of a post (newest first), each with its replies
 * (oldest first). Never throws: resolves to [] plus an error.
 */
export async function GetCommentAPI(
  { _id }: TThread,
  signal?: AbortSignal,
): Promise<{ comments: TComments[]; error: ApiFailure | null }> {
  const result = await apiRequest<unknown>(`/comment/list/post/${_id}`, {
    signal,
  });
  if (!result.ok) {
    return { comments: [], error: result };
  }
  return { comments: cleanComments(result.data), error: null };
}

/** Every comment the list shows, replies included. */
export function countComments(comments: TComments[]) {
  let count = 0;
  for (const comment of comments) {
    count += 1 + (comment.replies?.length ?? 0);
  }
  return count;
}

/** 「（已編輯）」: the backend's flag, or the timestamps when it is missing. */
export function isEdited(comment: TComments) {
  if (typeof comment.edited === "boolean") {
    return comment.edited;
  }
  const created = new Date(comment.createdAt ?? "").getTime();
  const updated = new Date(comment.updatedAt ?? "").getTime();
  return (
    Number.isFinite(created) &&
    Number.isFinite(updated) &&
    updated - created > EDITED_AFTER_MS
  );
}

/** How a comment's author is named in the UI. */
export function commentAuthorName(comment: TComments) {
  const user = comment.user;
  if (!user?.customId) {
    return "已刪除的使用者";
  }
  return user.name || `@${user.customId}`;
}

export function commentErrorMessage(result: ApiFailure) {
  switch (result.status) {
    case CustomStatus.INVALID_CONTENT_LENGTH:
      return `留言最多 ${COMMENT_MAX_LENGTH} 字`;
    case CustomStatus.EMPTY_CONTENT:
      return "留言不能是空白";
    case CustomStatus.FORBIDDEN:
      return "你沒有權限修改這則留言";
    case CustomStatus.NOT_FOUND:
      return "這則留言已經不存在";
    case CustomStatus.INVALID_REPLY_ID:
      return "要回覆的留言已經不存在";
    default:
      return result.message;
  }
}

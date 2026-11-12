import type { TComments } from "@/interfaces/comments";
import type { TThread } from "@/interfaces/Thread";
import { type ApiFailure, apiRequest } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";

/** The backend rejects longer comments (4023). */
export const COMMENT_MAX_LENGTH = 250;

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

/** Comments of a post; never throws, resolves to [] plus an error. */
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
  const list = Array.isArray(result.data) ? result.data : [];
  return {
    comments: list.filter(
      (item): item is TComments =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as TComments)._id === "string",
    ),
    error: null,
  };
}

export function commentErrorMessage(result: ApiFailure) {
  switch (result.status) {
    case CustomStatus.INVALID_CONTENT_LENGTH:
      return `留言最多 ${COMMENT_MAX_LENGTH} 字`;
    case CustomStatus.EMPTY_CONTENT:
      return "留言不能是空白";
    default:
      return result.message;
  }
}

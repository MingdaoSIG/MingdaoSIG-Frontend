"use client";

import { useCallback } from "react";

import type { TComments } from "@/interfaces/comments";
import type { Sig } from "@/interfaces/Sig";
import type { TThread } from "@/interfaces/Thread";
import useSig from "@/utils/useSig";
import { useUserAccount } from "@/utils/useUserAccount";

const ADMIN_PERMISSION = 2;

function idOf(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  return (value as Sig | null)?._id;
}

/**
 * What the signed-in user may do to the comments of a post. Mirrors the
 * backend (contract v3 §4.1):
 * - edit: the comment's author only.
 * - delete: the author, a manager (leader or 指導老師) of the post's SIG,
 *   or an admin.
 * - reply: anyone signed in (logged-out visitors are asked to log in).
 *
 * The author is matched by user id, or by custom id when the comment
 * list does not send the id.
 */
export function useCommentPermissions(post: TThread) {
  const { isLogin, userData } = useUserAccount();
  const userId = isLogin ? userData?._id : undefined;
  const customId = isLogin ? userData?.customId : undefined;
  const isAdmin = Boolean(userId) && userData?.permission === ADMIN_PERMISSION;

  const { data: sig } = useSig(idOf(post.sig));
  const isManager = Boolean(
    userId &&
      (sig?.leader?.includes(userId) || sig?.moderator?.includes(userId)),
  );
  const canModerate = isAdmin || isManager;

  const isOwn = useCallback(
    (comment: TComments) => {
      const author = comment.user;
      if (!author || (!userId && !customId)) {
        return false;
      }
      if (author._id) {
        return author._id === userId;
      }
      return Boolean(author.customId) && author.customId === customId;
    },
    [userId, customId],
  );

  const canEdit = useCallback((comment: TComments) => isOwn(comment), [isOwn]);
  const canDelete = useCallback(
    (comment: TComments) => isOwn(comment) || canModerate,
    [isOwn, canModerate],
  );

  return { isOwn, canEdit, canDelete };
}

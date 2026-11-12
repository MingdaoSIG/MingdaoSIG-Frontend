"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import type { TComments } from "@/interfaces/comments";
import type { TThread } from "@/interfaces/Thread";
import type { ApiFailure } from "@/modules/api/client";
import { useUserAccount } from "@/utils/useUserAccount";

import {
  commentAuthorName,
  commentErrorMessage,
  countComments,
  DeleteCommentAPI,
  EditCommentAPI,
  GetCommentAPI,
} from "../apis/CommentAPI";
import { useCommentPermissions } from "./useCommentPermissions";

export type CommentNotify = {
  success: (message: string) => void;
  error: (message: string) => void;
};

/** The comment a reply goes under (always top-level) and who it answers. */
export type ReplyTarget = {
  parentId: string;
  name: string;
};

/**
 * Comments of a post with everything the desktop and mobile comment UIs
 * share: loading, permissions, the reply target of the composer, which
 * reply threads are expanded, and the edit and delete actions. Each UI
 * passes its own way to report results (dialogs on desktop, toasts on
 * mobile).
 */
export function useComments(post: TThread, notify: CommentNotify) {
  const { token } = useUserAccount();
  const [comments, setComments] = useState<TComments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const permissions = useCommentPermissions(post);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      const result = await GetCommentAPI(post, signal);
      if (signal?.aborted) {
        return;
      }
      setError(result.error);
      if (!result.error) {
        setComments(result.comments);
      }
      setIsLoading(false);
    },
    [post],
  );

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    reload(controller.signal);
    return () => controller.abort();
  }, [reload]);

  const setThreadExpanded = useCallback((id: string, open: boolean) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (open) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  /** Replying to a reply attaches to its parent (one nesting level). */
  const startReply = useCallback((comment: TComments, parent?: TComments) => {
    setReplyTarget({
      parentId: parent?._id ?? comment._id,
      name: commentAuthorName(comment),
    });
  }, []);

  const cancelReply = useCallback(() => setReplyTarget(null), []);

  /** Called by the composer after the backend accepted a comment. */
  const onPosted = useCallback(
    (parentId: string | null) => {
      if (parentId) {
        // Show the new reply even in a collapsed thread.
        setThreadExpanded(parentId, true);
      }
      setReplyTarget(null);
      reload();
    },
    [reload, setThreadExpanded],
  );

  /** Saves an edit; true when the backend accepted it. */
  const edit = useCallback(
    async (comment: TComments, content: string) => {
      const result = await EditCommentAPI(comment._id, content, token);
      if (!result.ok) {
        notify.error(commentErrorMessage(result));
        return false;
      }
      const saved = result.data;
      const patch = (item: TComments): TComments =>
        item._id === comment._id
          ? {
              ...item,
              content:
                typeof saved?.content === "string" ? saved.content : content,
              updatedAt: saved?.updatedAt ?? new Date().toISOString(),
              edited: true,
            }
          : item;
      setComments((list) =>
        list.map((item) => ({
          ...patch(item),
          replies: item.replies?.map(patch),
        })),
      );
      notify.success("留言已更新");
      return true;
    },
    [token, notify],
  );

  /** Asks, then deletes. Others' comments are removed by a SIG manager. */
  const remove = useCallback(
    async (comment: TComments) => {
      const own = permissions.isOwn(comment);
      const replies = comment.replies?.length ?? 0;
      const lines = [
        replies > 0 ? `底下的 ${replies} 則回覆也會一起隱藏。` : "",
        "刪除後就無法復原。",
      ].filter(Boolean);
      const confirm = await Swal.fire({
        title: own
          ? "確定要刪除這則留言嗎？"
          : `確定要刪除 ${commentAuthorName(comment)} 的留言嗎？`,
        text: lines.join(""),
        icon: "warning",
        confirmButtonText: "刪除",
        confirmButtonColor: "#b42318",
        showCancelButton: true,
        cancelButtonText: "取消",
        focusCancel: true,
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: () => DeleteCommentAPI(comment._id, token),
      });
      if (!confirm.isConfirmed || !confirm.value) {
        return;
      }
      if (!confirm.value.ok) {
        notify.error(commentErrorMessage(confirm.value));
        return;
      }
      setComments((list) =>
        list
          .filter((item) => item._id !== comment._id)
          .map((item) => ({
            ...item,
            replies: item.replies?.filter((reply) => reply._id !== comment._id),
          })),
      );
      setReplyTarget((target) =>
        target?.parentId === comment._id ? null : target,
      );
      notify.success("留言已刪除");
      reload();
    },
    [permissions, token, notify, reload],
  );

  return {
    comments,
    count: countComments(comments),
    isLoading,
    error,
    reload,
    permissions,
    replyTarget,
    startReply,
    cancelReply,
    onPosted,
    expanded,
    setThreadExpanded,
    edit,
    remove,
  };
}

export type CommentsController = ReturnType<typeof useComments>;

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { sigDefaultColors } from "@/components/Threads/configs/sigDefaultColors";
// Interfaces
import type { TComments } from "@/interfaces/comments";
import type { TThread } from "@/interfaces/Thread";
import { isSubmitEnter } from "@/utils/keyboard";
import { promptLogin } from "@/utils/loginPrompt";
// Custom Hooks
import useAlert from "@/utils/useAlert";
import useSig from "@/utils/useSig";
import useUser from "@/utils/useUser";
// Utils
import { useUserAccount } from "@/utils/useUserAccount";

// API Request Function
import {
  COMMENT_MAX_LENGTH,
  commentErrorMessage,
  GetCommentAPI,
  PostCommentAPI,
} from "../apis/CommentAPI";
// Components
import Reply from "../components/Reply";
import { useCommentDraft } from "../components/useCommentDraft";

// Configs
import { alertMessageConfigs } from "../configs/alertMessages";

export default function ThreadInfo({ post }: { post: TThread }) {
  const [typeComments, setTypeComments] = useCommentDraft(post._id);
  const [comments, setComments] = useState<TComments[]>([]);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loginHint, setLoginHint] = useState(false);
  const { token, isLogin, isLoading: authLoading, login } = useUserAccount();
  const { showAlert } = useAlert();
  const { data: user } = useUser(post.user);
  const { data: sig } = useSig(post.sig);
  const composing = useRef(false);

  const route = useRouter();

  const trimmed = typeComments.trim();
  const tooLong = typeComments.length > COMMENT_MAX_LENGTH;
  const canSend = isLogin && trimmed.length > 0 && !tooLong && !submitting;

  const loadComments = useCallback(
    async (signal?: AbortSignal) => {
      const { comments, error } = await GetCommentAPI(post, signal);
      if (signal?.aborted) {
        return;
      }
      if (error) {
        setCommentsError(error.message);
        return;
      }
      setCommentsError(null);
      setComments(comments);
    },
    [post],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadComments(controller.signal);
    return () => controller.abort();
  }, [loadComments]);

  async function handleCommandSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (composing.current || submitting) {
      return;
    }
    if (!isLogin) {
      return promptLogin(login, {
        text: "登入後即可留言，輸入的內容會保留。",
      });
    }
    if (trimmed.length === 0) {
      return showAlert(alertMessageConfigs.noComment);
    }
    if (tooLong) {
      return Swal.fire({
        ...alertMessageConfigs.otherError,
        text: `留言最多 ${COMMENT_MAX_LENGTH} 字`,
      });
    }
    setSubmitting(true);
    const res = await PostCommentAPI(post?._id, "", trimmed, token);
    setSubmitting(false);
    if (res.ok) {
      setTypeComments("");
      showAlert(alertMessageConfigs.commentSuccess);
      loadComments();
      return;
    }
    Swal.fire({
      ...alertMessageConfigs.otherError,
      text: commentErrorMessage(res),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Author */}
      <div className="glass flex shrink-0 select-none items-center gap-3 rounded-card px-5 py-4">
        <Image
          src={user?.avatar || "/images/default-avatar.png"}
          width={48}
          height={48}
          alt=""
          className="size-12 shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-1.5 text-base">
            {/* Links wait for the id, so they never point at /@undefined */}
            <button
              type="button"
              className="cursor-pointer truncate font-bold text-ink-900 hover:underline disabled:cursor-default disabled:no-underline"
              disabled={!user?.customId}
              onClick={() => user?.customId && route.push(`/@${user.customId}`)}
            >
              {user?.name || "Loading..."}
            </button>
            <span aria-hidden className="text-ink-400">
              •
            </span>
            <button
              type="button"
              className="sig-text shrink-0 cursor-pointer font-semibold hover:underline disabled:cursor-default disabled:no-underline"
              style={{
                ["--sig-color" as string]: sigDefaultColors[sig?._id ?? ""],
              }}
              disabled={!sig?.customId}
              onClick={() => sig?.customId && route.push(`/@${sig.customId}`)}
            >
              {sig?.name || "Loading..."}
            </button>
          </div>
          <div className="text-[13px] text-ink-500">
            {
              new Date(post?.createdAt ?? "")
                .toLocaleString("zh-TW")
                .split(" ")[0]
            }
          </div>
        </div>
      </div>

      {/* Comments: sized to content, scrolls when it runs out of room */}
      <div className="glass flex min-h-0 flex-col rounded-card px-5 pt-4 pb-5">
        <div className="custom-scrollbar flex min-h-12 flex-col gap-4 overflow-y-auto overflow-x-hidden">
          {commentsError ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-2 py-4 text-center text-ink-500 text-sm"
            >
              <p>{commentsError}</p>
              <button
                type="button"
                className="cursor-pointer text-brand-700 hover:underline"
                onClick={() => loadComments()}
              >
                重試
              </button>
            </div>
          ) : comments.length !== 0 ? (
            comments.map((comment: TComments) => {
              return (
                <Reply
                  key={comment._id}
                  overflow={false}
                  customId={comment.user?.customId}
                  avatar={comment.user?.avatar}
                  content={comment.content}
                  createdAt={
                    new Date(comment.createdAt || "")
                      .toLocaleString("zh-TW")
                      .split(" ")[0]
                  }
                />
              );
            })
          ) : (
            <p className="py-4 text-center text-ink-500 text-sm">尚無留言</p>
          )}
        </div>
        <form
          className="mt-4 flex h-10 w-full shrink-0 items-center rounded-control border border-line bg-field pl-1 focus-within:ring-2 focus-within:ring-brand-700/30"
          onSubmit={handleCommandSubmit}
        >
          <input
            className="h-full w-full flex-1 bg-transparent px-3 text-ink-800 text-sm placeholder:text-ink-400 focus-visible:outline-none disabled:cursor-not-allowed"
            placeholder={isLogin ? "寫下你的想法…" : "登入後即可留言"}
            aria-label="留言內容"
            onFocus={() => {
              if (!isLogin && !authLoading) {
                setLoginHint(true);
              }
            }}
            onChange={(e) => setTypeComments(e.target.value)}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
            onKeyDown={(e) => {
              // Enter that picks an IME candidate must not send the comment
              if (e.key === "Enter" && !isSubmitEnter(e, true)) {
                e.preventDefault();
              }
            }}
            value={typeComments}
          />
          {typeComments.length > 0 && (
            <span
              className={`shrink-0 text-xs tabular-nums ${
                tooLong ? "text-danger-700" : "text-ink-400"
              }`}
              aria-live="polite"
            >
              {typeComments.length}/{COMMENT_MAX_LENGTH}
            </span>
          )}
          <button
            type="submit"
            aria-label="送出留言"
            disabled={submitting}
            className="flex h-full w-10 flex-none items-center justify-center"
          >
            <Image
              src={"/icons/bx-send.svg"}
              height={20}
              width={20}
              alt=""
              className={
                canSend
                  ? "cursor-pointer opacity-100"
                  : "cursor-not-allowed opacity-30"
              }
            />
          </button>
        </form>
        {loginHint && !isLogin && (
          <div className="mt-2 flex items-center justify-between gap-3 text-ink-700 text-sm">
            <span>登入後即可留言，輸入的內容會保留。</span>
            <button
              type="button"
              className="h-9 shrink-0 cursor-pointer rounded-control bg-brand-700 px-4 font-semibold text-white transition-colors hover:bg-brand-800"
              onClick={() => login()}
            >
              登入
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

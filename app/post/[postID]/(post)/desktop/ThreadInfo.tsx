"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useReport } from "@/components/Report/ReportDialog";
import { SeriesNav } from "@/components/Series/SeriesNav";
import { sigDefaultColors } from "@/components/Threads/configs/sigDefaultColors";
// Interfaces
import type { TThread } from "@/interfaces/Thread";
import { CustomStatus } from "@/modules/customStatusCode";
import { formatViews } from "@/modules/views";
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
  PostCommentAPI,
} from "../apis/CommentAPI";
// Components
import { CommentThread, ReplyBanner } from "../components/CommentView";
import { useCommentDraft } from "../components/useCommentDraft";
import { type CommentNotify, useComments } from "../components/useComments";

// Configs
import { alertMessageConfigs } from "../configs/alertMessages";

/** Small toast at the top for results that need no answer. */
function notice(icon: "success" | "error", title: string) {
  void Swal.fire({
    toast: true,
    position: "top",
    icon,
    title,
    showConfirmButton: false,
    timer: icon === "error" ? 4000 : 2000,
    timerProgressBar: true,
  });
}

export default function ThreadInfo({ post }: { post: TThread }) {
  const [typeComments, setTypeComments] = useCommentDraft(post._id);
  const [submitting, setSubmitting] = useState(false);
  const [loginHint, setLoginHint] = useState(false);
  const { token, isLogin, isLoading: authLoading, login } = useUserAccount();
  const { showAlert } = useAlert();
  const { data: user, isLoading: userLoading } = useUser(post.user);
  const { data: sig, isLoading: sigLoading } = useSig(post.sig);
  const composing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const notify = useMemo<CommentNotify>(
    () => ({
      success: (message) => notice("success", message),
      error: (message) =>
        Swal.fire({
          title: "操作失敗",
          text: message,
          icon: "error",
          confirmButtonText: "好",
          confirmButtonColor: "#0b5a83",
        }),
    }),
    [],
  );
  const controller = useComments(post, notify);
  const { comments, replyTarget } = controller;
  const report = useReport();

  const route = useRouter();

  const trimmed = typeComments.trim();
  const tooLong = typeComments.length > COMMENT_MAX_LENGTH;
  const canSend = isLogin && trimmed.length > 0 && !tooLong && !submitting;

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
    const parentId = replyTarget?.parentId ?? null;
    const res = await PostCommentAPI(post?._id, parentId ?? "", trimmed, token);
    setSubmitting(false);
    if (res.ok) {
      setTypeComments("");
      controller.onPosted(parentId);
      if (parentId) {
        notice("success", "已回覆");
      } else {
        showAlert(alertMessageConfigs.commentSuccess);
      }
      return;
    }
    Swal.fire({
      ...alertMessageConfigs.otherError,
      title: parentId ? "回覆失敗" : alertMessageConfigs.otherError.title,
      text:
        parentId && res.status === CustomStatus.INVALID_BODY
          ? "要回覆的留言已經不存在"
          : commentErrorMessage(res),
    });
  }

  function startReply(...args: Parameters<typeof controller.startReply>) {
    controller.startReply(...args);
    inputRef.current?.focus();
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
              {user?.name ||
                (user?.customId ? `@${user.customId}` : null) ||
                (userLoading ? "載入中…" : "未知的使用者")}
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
              {sig?.name || (sigLoading ? "載入中…" : "未知的 SIG")}
            </button>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink-500">
            {user?.name && user.customId && (
              <>
                <span className="truncate">@{user.customId}</span>
                <span aria-hidden className="text-ink-400">
                  ·
                </span>
              </>
            )}
            <span className="shrink-0">
              {
                new Date(post?.createdAt ?? "")
                  .toLocaleString("zh-TW")
                  .split(" ")[0]
              }
            </span>
            {typeof post.views === "number" && (
              <>
                <span aria-hidden className="text-ink-400">
                  ·
                </span>
                <span className="shrink-0" data-views>
                  {formatViews(post.views)} 次瀏覽
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <SeriesNav
        series={post.series}
        postId={post._id ?? ""}
        variant="desktop"
        className="shrink-0"
      />

      {/* Comments: sized to content, scrolls when it runs out of room */}
      <div className="glass flex min-h-0 flex-col rounded-card px-5 pt-4 pb-5">
        <div className="custom-scrollbar flex min-h-12 flex-col gap-4 overflow-y-auto overflow-x-hidden">
          {controller.error ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-2 py-4 text-center text-ink-500 text-sm"
            >
              <p>{controller.error.message}</p>
              <button
                type="button"
                className="cursor-pointer text-brand-700 hover:underline"
                onClick={() => controller.reload()}
              >
                重試
              </button>
            </div>
          ) : comments.length !== 0 ? (
            comments.map((comment) => (
              <CommentThread
                key={comment._id}
                comment={comment}
                controller={{ ...controller, startReply }}
                variant="desktop"
                onReport={(target) =>
                  report.open(
                    { kind: "comment", id: target._id },
                    target.content,
                  )
                }
              />
            ))
          ) : (
            <p className="py-4 text-center text-ink-500 text-sm">
              {controller.isLoading ? "載入中…" : "尚無留言"}
            </p>
          )}
        </div>
        <div className="mt-4 shrink-0">
          <ReplyBanner controller={controller} variant="desktop" />
          <form
            className="flex h-10 w-full shrink-0 items-center rounded-control border border-line bg-field pl-1 focus-within:ring-2 focus-within:ring-brand-700/30"
            onSubmit={handleCommandSubmit}
          >
            <input
              ref={inputRef}
              className="h-full w-full flex-1 bg-transparent px-3 text-ink-800 text-sm placeholder:text-ink-400 focus-visible:outline-none disabled:cursor-not-allowed"
              placeholder={
                !isLogin
                  ? "登入後即可留言"
                  : replyTarget
                    ? `回覆 ${replyTarget.name}…`
                    : "寫下你的想法…"
              }
              aria-label={replyTarget ? "回覆內容" : "留言內容"}
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
                if (e.key === "Escape" && replyTarget) {
                  controller.cancelReply();
                  return;
                }
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
              aria-label={replyTarget ? "送出回覆" : "送出留言"}
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
        </div>
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
      {report.dialog}
    </div>
  );
}

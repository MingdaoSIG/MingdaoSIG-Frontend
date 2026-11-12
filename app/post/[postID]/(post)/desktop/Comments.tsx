"use client";

import { MessageCircle, SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useReport } from "@/components/Report/ReportDialog";
import type { TThread } from "@/interfaces/Thread";
import { CustomStatus } from "@/modules/customStatusCode";
import { isSubmitEnter } from "@/utils/keyboard";
import { promptLogin } from "@/utils/loginPrompt";
import useAlert from "@/utils/useAlert";
import { useUserAccount } from "@/utils/useUserAccount";
import {
  COMMENT_MAX_LENGTH,
  commentErrorMessage,
  PostCommentAPI,
} from "../apis/CommentAPI";
import { CommentThread, ReplyBanner } from "../components/CommentView";
import { useCommentDraft } from "../components/useCommentDraft";
import { type CommentNotify, useComments } from "../components/useComments";
import { alertMessageConfigs } from "../configs/alertMessages";

// Comments under the article, full width (decision 6C). The composer sits
// at the end of the list and stays at the bottom of the window while the
// list is on screen, so 「回覆」 never has to scroll away to type.

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

export function Comments({ post }: { post: TThread }) {
  const [text, setText] = useCommentDraft(post._id);
  const [submitting, setSubmitting] = useState(false);
  const [loginHint, setLoginHint] = useState(false);
  const { token, isLogin, isLoading: authLoading, login } = useUserAccount();
  const { showAlert } = useAlert();
  const composing = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
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

  const trimmed = text.trim();
  const tooLong = text.length > COMMENT_MAX_LENGTH;
  const canSend = isLogin && trimmed.length > 0 && !tooLong && !submitting;

  // `/post/<id>#comments` (or the old #comments-section) opens here.
  useEffect(() => {
    const hash = window.location.hash;
    if (
      !controller.isLoading &&
      (hash === "#comments" || hash === "#comments-section")
    ) {
      sectionRef.current?.scrollIntoView({ block: "start" });
    }
  }, [controller.isLoading]);

  // Grows with the text, up to about six lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  async function send(event?: { preventDefault: () => void }) {
    event?.preventDefault();
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
      setText("");
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
    inputRef.current?.focus({ preventScroll: true });
  }

  return (
    <section
      ref={sectionRef}
      id="comments-section"
      aria-labelledby="comments-heading"
      className="scroll-mt-[var(--shell-top,5.5rem)] rounded-card border border-line bg-surface shadow-card"
      data-comments
    >
      <h2
        id="comments-heading"
        className="flex items-baseline gap-2 px-6 pt-5 pb-2 font-bold text-ink-900 text-lg"
      >
        留言
        <span className="font-normal text-ink-500 text-sm tabular-nums">
          {controller.count} 則
        </span>
      </h2>

      <div className="flex flex-col gap-4 px-6 pb-4">
        {controller.error ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-2 py-6 text-center text-ink-500 text-sm"
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
                report.open({ kind: "comment", id: target._id }, target.content)
              }
            />
          ))
        ) : (
          <p className="flex flex-col items-center gap-1.5 py-6 text-center text-ink-500 text-sm">
            {controller.isLoading ? (
              "載入中…"
            ) : (
              <>
                <MessageCircle aria-hidden className="size-6 text-ink-400" />
                尚無留言
              </>
            )}
          </p>
        )}
      </div>

      {/* Stays at the bottom of the window while the list is on screen */}
      <div className="sticky bottom-0 z-[2] rounded-b-card border-line border-t bg-surface/95 px-6 pt-3 pb-4 backdrop-blur">
        <ReplyBanner controller={controller} variant="desktop" />
        <form
          className="flex w-full items-end gap-2 rounded-control border border-line bg-field py-1 pr-1 pl-1 focus-within:ring-2 focus-within:ring-brand-700/30"
          onSubmit={send}
        >
          <textarea
            ref={inputRef}
            rows={1}
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-3 py-1.5 text-ink-800 text-sm leading-6 placeholder:text-ink-400 focus-visible:outline-none"
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
            onChange={(event) => setText(event.target.value)}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && replyTarget) {
                controller.cancelReply();
                return;
              }
              // Enter sends, Shift+Enter is a new line, and an Enter that
              // picks an IME candidate does neither.
              if (isSubmitEnter(event)) {
                void send(event);
              }
            }}
            value={text}
          />
          {text.length > 0 && (
            <span
              className={`shrink-0 self-center text-xs tabular-nums ${
                tooLong ? "text-danger-700" : "text-ink-400"
              }`}
              aria-live="polite"
            >
              {text.length}/{COMMENT_MAX_LENGTH}
            </span>
          )}
          <button
            type="submit"
            aria-label={replyTarget ? "送出回覆" : "送出留言"}
            disabled={submitting}
            className={`flex size-9 shrink-0 items-center justify-center rounded-control transition-colors ${
              canSend
                ? "cursor-pointer bg-brand-700 text-white hover:bg-brand-800"
                : "cursor-not-allowed text-ink-400"
            }`}
          >
            <SendHorizontal aria-hidden className="size-[18px]" />
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
      {report.dialog}
    </section>
  );
}

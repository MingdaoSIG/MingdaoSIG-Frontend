"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { TapScale } from "@/components/mobile/TapScale";
import { toast } from "@/components/mobile/Toast";
import { isSubmitEnter } from "@/utils/keyboard";
import { useUserAccount } from "@/utils/useUserAccount";

import {
  COMMENT_MAX_LENGTH,
  commentErrorMessage,
  PostCommentAPI,
} from "../../apis/CommentAPI";
import { useCommentDraft } from "../../components/useCommentDraft";

const DEFAULT_AVATAR = "/images/default-avatar.png";

type Props = {
  postId: string;
  onSubmitted: () => void;
};

export default function CommentComposer({ postId, onSubmitted }: Props) {
  const { isLogin, isLoading, userData, token, login } = useUserAccount();
  const [text, setText] = useCommentDraft(postId);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const avatar = userData?.avatar || DEFAULT_AVATAR;
  const tooLong = text.length > COMMENT_MAX_LENGTH;
  const canSend = !submitting && text.trim().length > 0 && !tooLong;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
  }, [text]);

  const askToLogin = () => {
    toast.info("登入後即可留言，輸入的內容會保留", {
      key: "login",
      action: { label: "登入", onClick: () => login() },
    });
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSend = async (e?: FormEvent | KeyboardEvent) => {
    e?.preventDefault();
    if (isLoading) {
      return;
    }
    if (!isLogin) {
      askToLogin();
      return;
    }
    if (tooLong) {
      toast.error(`留言最多 ${COMMENT_MAX_LENGTH} 字`);
      return;
    }
    if (!canSend) {
      return;
    }
    setSubmitting(true);
    const res = await PostCommentAPI(postId, "", text.trim(), token);
    setSubmitting(false);
    if (res.ok) {
      setText("");
      onSubmitted();
      toast.success("留言成功");
    } else {
      toast.error(commentErrorMessage(res));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter is a new line, and an Enter that picks an
    // IME candidate (注音/拼音) does neither.
    if (isSubmitEnter(e)) {
      handleSend(e);
    }
  };

  return (
    <div className="sticky right-0 bottom-0 left-0 z-10">
      <form
        onSubmit={handleSend}
        className="glass-bar flex items-center gap-2 border-line border-t px-3 py-2"
      >
        <Image
          src={avatar}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
          unoptimized
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
          }}
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!isLogin && !isLoading) {
              askToLogin();
            }
          }}
          placeholder={isLogin ? "寫下你的想法…" : "登入後即可留言"}
          aria-label="留言內容"
          rows={1}
          className="min-h-[2.25rem] min-w-0 flex-1 resize-none rounded-control border border-line bg-surface px-3 py-1.5 text-[16px] text-ink-800 outline-none placeholder:text-ink-400 focus:border-brand-700/40"
        />
        {text.length > 0 && (
          <span
            className={`flex-shrink-0 text-xs tabular-nums ${
              tooLong ? "text-danger-700" : "text-ink-400"
            }`}
            aria-live="polite"
          >
            {text.length}/{COMMENT_MAX_LENGTH}
          </span>
        )}
        <TapScale
          onClick={handleSend}
          className={
            canSend
              ? "flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-control bg-brand-700 shadow-sm"
              : "flex h-9 w-9 flex-shrink-0 cursor-not-allowed items-center justify-center rounded-control bg-field"
          }
          whileTap={canSend ? { scale: 0.9 } : undefined}
          aria-label="送出留言"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={canSend ? "#ffffff" : "#7a8694"}
          >
            <path d="m21.426 11.095-17-8A.999.999 0 0 0 3.03 4.242L4.969 12 3.03 19.758a.998.998 0 0 0 1.396 1.147l17-8a1 1 0 0 0 0-1.81zM5.481 18.197l.839-3.357L12 12 6.32 9.16l-.839-3.357L18.651 12l-13.17 6.197z" />
          </svg>
        </TapScale>
      </form>
    </div>
  );
}

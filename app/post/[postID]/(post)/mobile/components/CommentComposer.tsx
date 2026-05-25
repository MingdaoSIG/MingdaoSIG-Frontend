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
import type { TComments } from "@/interfaces/comments";
import { useUserAccount } from "@/utils/useUserAccount";

import { PostCommentAPI } from "../../apis/CommentAPI";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_AVATAR = `${API_URL}/image/653299930b891d1f6b5b4458`;

type Props = {
  postId: string;
  replyingTo: TComments | null;
  onClearReply: () => void;
  onSubmitted: () => void;
};

export default function CommentComposer({
  postId,
  replyingTo,
  onClearReply,
  onSubmitted,
}: Props) {
  const { isLogin, isLoading, userData, token, login } = useUserAccount();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const avatar = userData?.avatar || DEFAULT_AVATAR;
  const canSend = !submitting && text.trim().length > 0;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
  }, [text]);

  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSend = async (e?: FormEvent | KeyboardEvent) => {
    e?.preventDefault();
    if (isLoading) {
      return;
    }
    if (!isLogin) {
      toast.info("登入後即可留言", {
        action: { label: "登入", onClick: () => login() },
      });
      return;
    }
    if (!canSend) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await PostCommentAPI(
        postId,
        replyingTo?._id ?? "",
        text.trim(),
        token,
      );
      if (res?.status === 2000) {
        setText("");
        onClearReply();
        onSubmitted();
        toast.success("留言成功");
      } else {
        toast.error("發送失敗");
      }
    } catch (_err) {
      toast.error("發送失敗");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSend(e);
    }
  };

  return (
    <div className="sticky right-0 bottom-0 left-0 z-10">
      {replyingTo && (
        <div className="flex items-center justify-between bg-[#009BB0]/10 px-3.5 py-1.5 text-[11px] text-md-dark-green">
          <span>
            ↩ 回覆 <strong>@{replyingTo.user.customId}</strong>
          </span>
          <button
            type="button"
            onClick={onClearReply}
            className="text-gray-500"
            aria-label="取消回覆"
          >
            ✕
          </button>
        </div>
      )}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-black/5 border-t bg-white/97 px-3 py-2 backdrop-blur-md"
      >
        <Image
          src={avatar}
          alt="your avatar"
          width={32}
          height={32}
          className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
          unoptimized
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? "寫下你的回覆…" : "寫下你的想法…"}
          aria-label="留言內容"
          rows={1}
          className="min-h-[2rem] flex-1 resize-none rounded-2xl bg-[#f1f5f9] px-3.5 py-1.5 text-[13px] text-md-dark-green outline-none"
        />
        <TapScale
          onClick={handleSend}
          className={
            canSend
              ? "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-md-light-green text-white"
              : "flex h-8 w-8 flex-shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-gray-300 text-white"
          }
          whileTap={canSend ? { scale: 0.9 } : undefined}
          aria-label="送出留言"
        >
          ➤
        </TapScale>
      </form>
    </div>
  );
}

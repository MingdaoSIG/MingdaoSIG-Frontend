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
import { useUserAccount } from "@/utils/useUserAccount";

import { PostCommentAPI } from "../../apis/CommentAPI";

const DEFAULT_AVATAR = "/images/default-avatar.png";

type Props = {
  postId: string;
  onSubmitted: () => void;
};

export default function CommentComposer({ postId, onSubmitted }: Props) {
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
      const res = await PostCommentAPI(postId, "", text.trim(), token);
      if (res?.status === 2000) {
        setText("");
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
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
          }}
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="寫下你的想法…"
          aria-label="留言內容"
          rows={1}
          className="min-h-[2rem] min-w-0 flex-1 resize-none rounded-2xl bg-[#f1f5f9] px-3.5 py-1.5 text-[13px] text-md-dark-green outline-none"
        />
        <TapScale
          onClick={handleSend}
          className={
            canSend
              ? "flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-md-light-green shadow-sm"
              : "flex h-9 w-9 flex-shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-gray-200"
          }
          whileTap={canSend ? { scale: 0.9 } : undefined}
          aria-label="送出留言"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={canSend ? "#ffffff" : "#9ca3af"}
          >
            <path d="m21.426 11.095-17-8A.999.999 0 0 0 3.03 4.242L4.969 12 3.03 19.758a.998.998 0 0 0 1.396 1.147l17-8a1 1 0 0 0 0-1.81zM5.481 18.197l.839-3.357L12 12 6.32 9.16l-.839-3.357L18.651 12l-13.17 6.197z" />
          </svg>
        </TapScale>
      </form>
    </div>
  );
}

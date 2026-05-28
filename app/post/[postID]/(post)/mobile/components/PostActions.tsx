"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { TapScale } from "@/components/mobile/TapScale";
import { toast } from "@/components/mobile/Toast";
import type { TThread } from "@/interfaces/Thread";
import { useUserAccount } from "@/utils/useUserAccount";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Props = {
  post: TThread;
  commentCount: number;
};

export default function PostActions({ post, commentCount }: Props) {
  const router = useRouter();
  const { isLogin, isLoading, token, userData } = useUserAccount();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes ?? 0);

  useEffect(() => {
    if (isLogin && userData?._id) {
      setLiked(Boolean(post.like?.includes(userData._id)));
    }
  }, [isLogin, post.like, userData?._id]);

  const onLike = async () => {
    if (isLoading) {
      return;
    }
    if (!isLogin) {
      toast.info("登入後即可按讚");
      return;
    }
    const willLike = !liked;
    setLiked(willLike);
    setLikeCount((c) => c + (willLike ? 1 : -1));
    try {
      await fetch(`${API_URL}/post/${post._id}/like`, {
        method: willLike ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });
    } catch (_err) {
      setLiked(!willLike);
      setLikeCount((c) => c + (willLike ? -1 : 1));
    }
  };

  const onCommentTap = () => {
    window.dispatchEvent(new CustomEvent("mobile:scroll-to-comments"));
  };

  const onEdit = () => {
    router.push(`/post/${post._id}/edit`);
  };

  const isOwner = isLogin && post.user === userData?._id;

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/70 px-3.5 py-2.5 backdrop-blur-md">
      <TapScale
        onClick={onLike}
        className="flex cursor-pointer items-center gap-1.5 p-1"
        whileTap={{ scale: 0.85 }}
        aria-label="按讚"
        aria-pressed={liked}
      >
        <motion.svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 32 32"
          animate={{ scale: liked ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          <path
            d="M26.9399 6.38798C26.2047 5.64761 25.3304 5.05985 24.3673 4.65849C23.4042 4.25714 22.3713 4.05012 21.3279 4.04932C19.3543 4.04964 17.4528 4.79101 15.9999 6.12665C14.5471 4.79079 12.6455 4.04938 10.6719 4.04932C9.62728 4.0504 8.59319 4.25806 7.62914 4.66034C6.66509 5.06262 5.79011 5.65158 5.05456 6.39332C1.91723 9.54398 1.91856 14.472 5.05723 17.6093L15.9999 28.552L26.9426 17.6093C30.0812 14.472 30.0826 9.54398 26.9399 6.38798Z"
            fill={liked ? "#EE5757" : "#BDBDBD"}
          />
        </motion.svg>
        <span
          className="font-semibold text-sm"
          style={{ color: liked ? "#EE5757" : "#354242" }}
        >
          {likeCount}
        </span>
      </TapScale>
      <TapScale
        onClick={onCommentTap}
        className="flex cursor-pointer items-center gap-1.5 p-1 text-md-dark-green"
        whileTap={{ scale: 0.9 }}
        aria-label="跳至留言"
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="font-semibold text-sm">{commentCount}</span>
      </TapScale>
      <div className="flex-1" />
      {isOwner && (
        <TapScale
          onClick={onEdit}
          className="flex cursor-pointer items-center justify-center p-1"
          whileTap={{ scale: 0.9 }}
          aria-label="編輯貼文"
        >
          <Image src="/icons/edit.svg" width={24} height={24} alt="編輯" />
        </TapScale>
      )}
    </div>
  );
}

"use client";

import { MessageCircle, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { BookmarkButton } from "@/components/Bookmark/BookmarkButton";
import { TapScaleButton } from "@/components/mobile/TapScale";
import { toast } from "@/components/mobile/Toast";
import type { TThread } from "@/interfaces/Thread";
import { useUserAccount } from "@/utils/useUserAccount";
import { sharePost } from "../../components/sharePost";
import { usePostLike } from "../../components/usePostLike";

// The mobile post page's sticky bottom bar (decision 6C): 讚 / 留言 /
// 收藏 / 分享. 留言 hands the same place over to the comment composer
// (see Thread.tsx), so the bar never covers it. Announcements have no
// 讚 and no comments.

export default function BottomBar({
  post,
  commentCount,
  onComment,
  isAnnouncement = false,
}: {
  post: TThread;
  commentCount: number;
  onComment: () => void;
  isAnnouncement?: boolean;
}) {
  const { login } = useUserAccount();
  const like = usePostLike(post, {
    onLoginNeeded: () =>
      toast.info("登入後即可按讚", {
        key: "login",
        action: { label: "登入", onClick: () => login() },
      }),
    onError: (message) => toast.error(message),
  });

  async function onShare() {
    const result = await sharePost(post.title);
    if (result === "copied") {
      toast.info("已複製連結");
    } else if (result === "failed") {
      toast.error("無法複製連結");
    }
  }

  const item =
    "flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-control px-2 font-semibold text-ink-700 text-sm";

  return (
    <nav
      aria-label="貼文動作"
      className="glass-bar flex items-center gap-1 border-line border-t px-2 py-1"
      data-post-bar
    >
      {!isAnnouncement && (
        <TapScaleButton
          type="button"
          onClick={like.toggle}
          className={item}
          whileTap={{ scale: 0.88 }}
          aria-label={`${like.liked ? "取消喜歡" : "喜歡"}（${like.count} 個讚）`}
          aria-pressed={like.liked}
        >
          <motion.svg
            aria-hidden="true"
            width="21"
            height="21"
            viewBox="0 0 32 32"
            animate={{ scale: like.liked ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <path
              d="M26.9399 6.38798C26.2047 5.64761 25.3304 5.05985 24.3673 4.65849C23.4042 4.25714 22.3713 4.05012 21.3279 4.04932C19.3543 4.04964 17.4528 4.79101 15.9999 6.12665C14.5471 4.79079 12.6455 4.04938 10.6719 4.04932C9.62728 4.0504 8.59319 4.25806 7.62914 4.66034C6.66509 5.06262 5.79011 5.65158 5.05456 6.39332C1.91723 9.54398 1.91856 14.472 5.05723 17.6093L15.9999 28.552L26.9426 17.6093C30.0812 14.472 30.0826 9.54398 26.9399 6.38798Z"
              fill={like.liked ? "#e05252" : "#bdc4cc"}
            />
          </motion.svg>
          <span
            className="tabular-nums"
            style={{ color: like.liked ? "#d64545" : undefined }}
          >
            {like.count}
          </span>
        </TapScaleButton>
      )}
      {!isAnnouncement && (
        <TapScaleButton
          type="button"
          onClick={onComment}
          className={item}
          whileTap={{ scale: 0.92 }}
          aria-label={`留言（${commentCount} 則）`}
        >
          <MessageCircle aria-hidden className="size-5" />
          <span className="tabular-nums">{commentCount}</span>
        </TapScaleButton>
      )}
      <BookmarkButton postId={post._id} size="bar" className="flex-1" />
      <TapScaleButton
        type="button"
        onClick={onShare}
        className={item}
        whileTap={{ scale: 0.92 }}
        aria-label="分享"
      >
        <Share2 aria-hidden className="size-5" />
        <span aria-hidden>分享</span>
      </TapScaleButton>
    </nav>
  );
}

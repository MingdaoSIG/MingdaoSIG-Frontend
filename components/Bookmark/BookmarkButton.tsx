"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { promptLogin } from "@/utils/loginPrompt";
import { notice } from "@/utils/notice";
import { useBookmarks } from "@/utils/useBookmarks";
import { isMobileViewport } from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

const SIZES = {
  /** Post cards: small, sits in the meta row above the card link. */
  card: { box: "size-8", icon: 16 },
  /** Post page title bar (desktop). */
  toolbar: { box: "size-9", icon: 20 },
  /** Mobile post action bar: 44px touch target. */
  touch: { box: "size-11", icon: 22 },
};

/**
 * 收藏 / 取消收藏 for one post (contract v4 §4.3). Logged out, it explains
 * that saving needs an account and offers to log in.
 */
export function BookmarkButton({
  postId,
  size = "card",
  className = "",
}: {
  postId: string | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { isLogin, isLoading, login } = useUserAccount();
  const bookmarks = useBookmarks();
  const [busy, setBusy] = useState(false);
  const saved = bookmarks.isBookmarked(postId);
  const { box, icon } = SIZES[size];

  async function onClick(event: React.MouseEvent<HTMLButtonElement>) {
    // Cards are links; the button must not open the post.
    event.preventDefault();
    event.stopPropagation();
    if (!postId || isLoading || busy) {
      return;
    }
    if (!isLogin) {
      if (isMobileViewport()) {
        toast.info("登入後即可收藏貼文", {
          key: "login",
          action: { label: "登入", onClick: () => login() },
        });
      } else {
        promptLogin(login, {
          text: "登入後即可收藏貼文，之後在個人頁面查看。",
        });
      }
      return;
    }
    setBusy(true);
    const result = await bookmarks.toggle(postId);
    setBusy(false);
    if (!result.ok) {
      notice(
        "error",
        `${result.added ? "收藏" : "取消收藏"}失敗：${result.message}`,
      );
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "取消收藏" : "收藏"}
      title={saved ? "取消收藏" : "收藏"}
      data-bookmark={postId}
      className={`relative z-[1] flex shrink-0 cursor-pointer items-center justify-center rounded-control transition-colors hover:bg-field ${box} ${
        saved ? "text-brand-700" : "text-ink-500 hover:text-ink-800"
      } ${className}`}
    >
      <Bookmark
        aria-hidden
        size={icon}
        strokeWidth={2}
        fill={saved ? "currentColor" : "none"}
      />
    </button>
  );
}

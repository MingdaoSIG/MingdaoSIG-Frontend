"use client";

import { useEffect, useState } from "react";
import type { TThread } from "@/interfaces/Thread";
import { apiRequest } from "@/modules/api/client";
import { useUserAccount } from "@/utils/useUserAccount";

/**
 * 讚 on the post page (desktop action row and the mobile bottom bar). The
 * change shows at once and is undone when the server refuses; a refusal
 * (a mute answers 4041 with its own message) goes to `onError`.
 */
export function usePostLike(
  post: TThread,
  {
    onLoginNeeded,
    onError,
  }: {
    onLoginNeeded: () => void;
    onError: (message: string, wasLiking: boolean) => void;
  },
) {
  const { isLogin, isLoading, token, userData } = useUserAccount();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(post.likes ?? post.like?.length ?? 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isLogin && userData?._id) {
      setLiked(Boolean(post.like?.includes(userData._id)));
    }
  }, [isLogin, post.like, userData?._id]);

  async function toggle() {
    if (isLoading || busy) {
      return;
    }
    if (!isLogin) {
      onLoginNeeded();
      return;
    }
    const willLike = !liked;
    setLiked(willLike);
    setCount((value) => value + (willLike ? 1 : -1));
    setBusy(true);
    const res = await apiRequest(`/post/${post._id}/like`, {
      method: willLike ? "POST" : "DELETE",
      token,
    });
    setBusy(false);
    if (!res.ok) {
      setLiked(!willLike);
      setCount((value) => value + (willLike ? -1 : 1));
      onError(res.message, willLike);
    }
  }

  return { liked, count, toggle };
}

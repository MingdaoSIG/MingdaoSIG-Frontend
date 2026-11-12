"use client";
import dynamic from "next/dynamic";
import { use, useEffect, useState } from "react";

import { NotFound } from "@/components/NotFound";
// Interfaces
import type { TThread } from "@/interfaces/Thread";
import { apiRequest } from "@/modules/api/client";
// Validation
import { isValidObjectId, sanitizeUrlParam } from "@/modules/validation";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
import { PostSkeleton } from "./(post)/components/PostSkeleton";

// Desktop and mobile threads are separate component trees; load only the
// one this device needs.
const PostDesktop = dynamic(() => import("./(post)/desktop/PostLayout"));
const ThreadMobile = dynamic(() => import("./(post)/mobile/Thread"));

// Client side of /post/[postID]; page.tsx (a Server Component) adds the
// share preview metadata and renders this unchanged.
const Post = ({ params }: { params: Promise<{ postID: string }> }) => {
  const isMobile = useIsMobile();
  const { isLoading: authLoading } = useUserAccount();

  // Unwrap the params Promise using React.use()
  const unwrappedParams = use(params);
  const rawPostID = decodeURIComponent(unwrappedParams.postID);

  // 驗證並清理 postID（防止路徑遍歷）
  const PostID = sanitizeUrlParam(rawPostID);

  const [post, setPost] = useState<TThread>();
  const [status, setStatus] = useState<
    "loading" | "notfound" | "error" | "success"
  >("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  // `attempt` re-runs the fetch when the user presses retry. It waits for
  // the login: the request carries the JWT so a signed-in reader's views
  // count once per person (contract v4 §4.1).
  useEffect(() => {
    // 驗證 PostID 格式
    if (!isValidObjectId(PostID)) {
      setStatus("notfound");
      return;
    }
    if (authLoading) {
      return;
    }

    const controller = new AbortController();
    (async () => {
      setStatus("loading");
      const result = await apiRequest<TThread>(`/post/${PostID}`, {
        signal: controller.signal,
        auth: true,
      });
      if (controller.signal.aborted) {
        return;
      }
      if (result.ok && typeof result.data?._id === "string") {
        setPost(result.data);
        setStatus("success");
      } else if (!result.ok && result.kind === "not-found") {
        setStatus("notfound");
      } else {
        setErrorMessage(
          result.ok ? "伺服器暫時無法回應，請稍後再試" : result.message,
        );
        setStatus("error");
      }
    })();

    return () => controller.abort();
  }, [PostID, attempt, authLoading]);

  if (status === "loading") {
    return <PostSkeleton isMobile={isMobile} />;
  }
  if (status === "error" || (status === "success" && !post)) {
    return (
      <div
        role="alert"
        className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-ink-700"
      >
        <p>{errorMessage || "伺服器暫時無法回應，請稍後再試"}</p>
        <button
          type="button"
          className="cursor-pointer rounded-control border border-line bg-surface px-4 py-2 text-sm hover:bg-field"
          onClick={() => setAttempt((n) => n + 1)}
        >
          重試
        </button>
      </div>
    );
  }
  if (status === "notfound" || !post) {
    return (
      <NotFound
        content={{
          message: "找不到這篇貼文",
        }}
        image={{
          show: false,
        }}
      />
    );
  }
  // Keyed by post: a series link to the next post starts at the top.
  return isMobile ? (
    <ThreadMobile
      key={post._id}
      post={post}
      isAnnouncement={post.sig === "652d60b842cdf6a660c2b778"}
    />
  ) : (
    <PostDesktop key={post._id} post={post} />
  );
};

export default Post;

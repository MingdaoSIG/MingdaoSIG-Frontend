"use client";
import dynamic from "next/dynamic";
import { use, useEffect, useState } from "react";

// Layout
import SplitBlock from "@/app/(Layout)/splitBlock";

import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { NotFound } from "@/components/NotFound";
// Interfaces
import type { TThread } from "@/interfaces/Thread";
import { apiRequest } from "@/modules/api/client";
// Validation
import { isValidObjectId, sanitizeUrlParam } from "@/modules/validation";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import ThreadInfo from "./(post)/desktop/ThreadInfo";

// Desktop and mobile threads are separate component trees; load only the
// one this device needs.
const ThreadDesktop = dynamic(() => import("./(post)/desktop/Thread"));
const ThreadMobile = dynamic(() => import("./(post)/mobile/Thread"));

const Post = ({ params }: { params: Promise<{ postID: string }> }) => {
  const isMobile = useIsMobile();

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

  // `attempt` re-runs the fetch when the user presses retry.
  useEffect(() => {
    // 驗證 PostID 格式
    if (!isValidObjectId(PostID)) {
      setStatus("notfound");
      return;
    }

    const controller = new AbortController();
    (async () => {
      setStatus("loading");
      const result = await apiRequest<TThread>(`/post/${PostID}`, {
        signal: controller.signal,
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
  }, [PostID, attempt]);

  if (status === "loading") {
    return <div></div>;
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
  if (post.sig === "652d60b842cdf6a660c2b778") {
    return isMobile ? (
      <ThreadMobile post={post} isAnnouncement />
    ) : (
      <ThreadDesktop post={post} />
    );
  }
  return isMobile ? (
    <ThreadMobile post={post}></ThreadMobile>
  ) : (
    <SplitBlock>
      <ThreadDesktop post={post} />
      {/* Comments failing to render must not take the post down */}
      <SectionErrorBoundary label="留言">
        <ThreadInfo post={post} />
      </SectionErrorBoundary>
    </SplitBlock>
  );
};

export default Post;

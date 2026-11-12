"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { toast } from "@/components/mobile/Toast";
import type { TThread } from "@/interfaces/Thread";

import { type CommentNotify, useComments } from "../components/useComments";
import CommentComposer from "./components/CommentComposer";
import CommentList from "./components/CommentList";
import PostActions from "./components/PostActions";
import PostBody from "./components/PostBody";
import PostHeader from "./components/PostHeader";

type Props = {
  post: TThread;
  isAnnouncement?: boolean;
};

export default function Thread({ post, isAnnouncement }: Props) {
  // The like bar and comments wait for the body: rendered first, they sat
  // right under a three-line placeholder and jumped thousands of pixels
  // down when the post appeared (CLS 0.56 on long posts).
  const [bodyReady, setBodyReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const commentsAnchorRef = useRef<HTMLDivElement>(null);
  const notify = useMemo<CommentNotify>(
    () => ({
      success: (message) => toast.success(message),
      error: (message) => toast.error(message),
    }),
    [],
  );
  const controller = useComments(post, notify);
  const { error } = controller;

  // Keep what is already shown; just say the refresh failed.
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    const onScrollToComments = () => {
      commentsAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };
    window.addEventListener("mobile:scroll-to-comments", onScrollToComments);
    return () => {
      window.removeEventListener(
        "mobile:scroll-to-comments",
        onScrollToComments,
      );
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="scrollbar-hide absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex min-w-0 flex-col gap-2 px-2 pt-2">
        <PostHeader post={post} isAnnouncement={isAnnouncement} />
        <PostBody
          post={post}
          isAnnouncement={isAnnouncement}
          onReady={() => setBodyReady(true)}
        />
        {!isAnnouncement && bodyReady && (
          <PostActions post={post} commentCount={controller.count} />
        )}
      </div>
      {!isAnnouncement && bodyReady && (
        <>
          <div ref={commentsAnchorRef} className="mt-2 min-w-0 px-1">
            <SectionErrorBoundary label="留言">
              <CommentList controller={controller} />
            </SectionErrorBoundary>
          </div>
          <CommentComposer postId={post._id ?? ""} controller={controller} />
        </>
      )}
    </div>
  );
}

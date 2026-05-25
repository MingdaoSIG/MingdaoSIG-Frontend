"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { TComments } from "@/interfaces/comments";
import type { TThread } from "@/interfaces/Thread";

import { GetCommentAPI } from "../apis/CommentAPI";
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
  const [comments, setComments] = useState<TComments[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<TComments | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const commentsAnchorRef = useRef<HTMLDivElement>(null);

  const refetchComments = useCallback(async () => {
    try {
      const res = await GetCommentAPI(post);
      setComments(res?.data ?? []);
    } catch (_err) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [post]);

  useEffect(() => {
    setCommentsLoading(true);
    refetchComments();
  }, [refetchComments]);

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
        <PostBody post={post} isAnnouncement={isAnnouncement} />
        {!isAnnouncement && (
          <PostActions post={post} commentCount={comments.length} />
        )}
      </div>
      {!isAnnouncement && (
        <>
          <div ref={commentsAnchorRef} className="mt-2 min-w-0 px-1">
            <CommentList
              comments={comments}
              isLoading={commentsLoading}
              onReply={setReplyingTo}
            />
          </div>
          <CommentComposer
            postId={post._id ?? ""}
            replyingTo={replyingTo}
            onClearReply={() => setReplyingTo(null)}
            onSubmitted={() => {
              refetchComments();
            }}
          />
        </>
      )}
    </div>
  );
}

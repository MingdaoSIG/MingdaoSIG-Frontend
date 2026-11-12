"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { toast } from "@/components/mobile/Toast";
import { useReport } from "@/components/Report/ReportDialog";
import { SeriesNav } from "@/components/Series/SeriesNav";
import { TeacherFeedback } from "@/components/TeacherFeedback/TeacherFeedback";
import type { TThread } from "@/interfaces/Thread";

import { type CommentNotify, useComments } from "../components/useComments";
import BottomBar from "./components/BottomBar";
import CommentComposer from "./components/CommentComposer";
import CommentList from "./components/CommentList";
import PostBody from "./components/PostBody";
import PostHeader from "./components/PostHeader";

type Props = {
  post: TThread;
  isAnnouncement?: boolean;
};

// Mobile post page (decision 6C): the post, 老師回饋, then the comments,
// with one sticky place at the bottom shared by the action bar (讚 / 留言
// / 收藏 / 分享) and the comment composer. The composer takes over when
// 「留言」 is tapped, when replying, and while the comments are on screen;
// 「收起」 or scrolling back up to the post brings the bar back.

export default function Thread({ post, isAnnouncement }: Props) {
  // The comments wait for the body: rendered first, they sat right under
  // a three-line placeholder and jumped thousands of pixels down when the
  // post appeared (CLS 0.56 on long posts).
  const [bodyReady, setBodyReady] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [focusRequested, setFocusRequested] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const commentsAnchorRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const notify = useMemo<CommentNotify>(
    () => ({
      success: (message) => toast.success(message),
      error: (message) => toast.error(message),
    }),
    [],
  );
  const controller = useComments(post, notify);
  const { error, replyTarget } = controller;
  const report = useReport();
  const hasComments = !isAnnouncement;

  // Keep what is already shown; just say the refresh failed.
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  // The comments coming on screen open the composer; leaving them hands
  // the place back to the bar, unless the reader is typing.
  useEffect(() => {
    const anchor = commentsAnchorRef.current;
    if (!hasComments || !bodyReady || !anchor) {
      return;
    }
    // The first report is where the page opened: a short post shows its
    // comments at once, and then the bar (讚, 收藏…) must stay.
    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (first) {
          first = false;
          return;
        }
        if (entry.isIntersecting) {
          setComposerOpen(true);
          return;
        }
        const typing = slotRef.current?.contains(document.activeElement);
        if (!typing) {
          setComposerOpen(false);
        }
      },
      { root: scrollRef.current, rootMargin: "0px 0px -35% 0px" },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [hasComments, bodyReady]);

  // A reply always needs the composer.
  useEffect(() => {
    if (replyTarget) {
      setComposerOpen(true);
    }
  }, [replyTarget]);

  // `/post/<id>#comments` (or #comments-section) opens at the comments.
  useEffect(() => {
    const hash = window.location.hash;
    if (
      bodyReady &&
      !controller.isLoading &&
      (hash === "#comments" || hash === "#comments-section")
    ) {
      commentsAnchorRef.current?.scrollIntoView({ block: "start" });
    }
  }, [bodyReady, controller.isLoading]);

  function openComments() {
    commentsAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setComposerOpen(true);
    setFocusRequested(true);
  }

  const showComposer = hasComments && bodyReady && composerOpen;

  return (
    <div
      ref={scrollRef}
      className="scrollbar-hide absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]"
      data-post-scroll
    >
      <div className="flex min-w-0 flex-col gap-2 px-2 pt-2">
        <PostHeader
          post={post}
          isAnnouncement={isAnnouncement}
          onReport={() =>
            report.open({ kind: "post", id: post._id ?? "" }, post.title)
          }
        />
        <PostBody
          post={post}
          isAnnouncement={isAnnouncement}
          onReady={() => setBodyReady(true)}
        />
        {!isAnnouncement && bodyReady && (
          <SeriesNav
            series={post.series}
            postId={post._id ?? ""}
            variant="mobile"
          />
        )}
      </div>
      {hasComments && bodyReady && (
        <>
          <div className="min-w-0 px-2 pt-2 empty:hidden">
            <TeacherFeedback post={post} variant="mobile" />
          </div>
          <div
            ref={commentsAnchorRef}
            className="mt-2 min-w-0 scroll-mt-[calc(4.5rem+env(safe-area-inset-top))] px-1"
          >
            <SectionErrorBoundary label="留言">
              <CommentList
                controller={controller}
                onReport={(comment) =>
                  report.open(
                    { kind: "comment", id: comment._id },
                    comment.content,
                  )
                }
              />
            </SectionErrorBoundary>
          </div>
        </>
      )}
      <div className="flex-1" />
      {/* One place for the bar and the composer, so neither covers the other */}
      {bodyReady && (
        <div ref={slotRef} className="sticky right-0 bottom-0 left-0 z-10">
          {showComposer ? (
            <CommentComposer
              postId={post._id ?? ""}
              controller={controller}
              focusRequested={focusRequested}
              onFocused={() => setFocusRequested(false)}
              onCollapse={() => {
                controller.cancelReply();
                setComposerOpen(false);
              }}
            />
          ) : (
            <BottomBar
              post={post}
              commentCount={controller.count}
              onComment={openComments}
              isAnnouncement={isAnnouncement}
            />
          )}
        </div>
      )}
      {report.dialog}
    </div>
  );
}

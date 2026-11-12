"use client";

import { useRef, useState } from "react";
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { SeriesNav } from "@/components/Series/SeriesNav";
import { TeacherFeedback } from "@/components/TeacherFeedback/TeacherFeedback";
import { announcementSigId } from "@/components/Threads/configs/announcement";
import type { TThread } from "@/interfaces/Thread";
import {
  TableOfContents,
  usePostHeadings,
} from "../components/TableOfContents";
import { AuthorCard } from "./AuthorCard";
import { Comments } from "./Comments";
import Thread from "./Thread";

// Desktop post page (decision 6C): a reading column and a sticky right
// rail (author, series, table of contents). 老師回饋 and the comments
// follow the article at the column's full width. The page scrolls as one
// block inside the shell; reader mode (`.layout-split`, data-shell="aside",
// data-reader-hide) turns it into a plain document, as before.

export default function PostLayout({ post }: { post: TThread }) {
  const articleRef = useRef<HTMLElement>(null);
  const [bodyReady, setBodyReady] = useState(false);
  const { headings, activeId } = usePostHeadings(
    articleRef,
    bodyReady,
    post.title,
  );
  const isAnnouncement = post.sig === announcementSigId;

  return (
    <div
      data-post-scroll
      className="custom-scrollbar h-full min-h-0 overflow-y-auto overflow-x-hidden"
    >
      <div className="layout-split mx-auto grid w-[min(74rem,100%-4rem)] grid-cols-[minmax(0,1fr)_17.5rem] items-start gap-8 pb-8">
        <div data-split-main className="flex min-w-0 flex-col gap-5">
          <Thread
            post={post}
            articleRef={articleRef}
            onBodyReady={() => setBodyReady(true)}
          />
          {/* After the post is in: rendered first, they jumped down when it
              arrived (and #feedback scrolled to the wrong place). */}
          {!isAnnouncement && bodyReady && (
            <div data-reader-hide className="flex min-w-0 flex-col gap-5">
              {/* Private: only the author, the SIG's 指導老師 and admins */}
              <TeacherFeedback post={post} />
              {/* Comments failing to render must not take the post down */}
              <SectionErrorBoundary label="留言">
                <Comments post={post} />
              </SectionErrorBoundary>
            </div>
          )}
        </div>
        <aside
          data-shell="aside"
          aria-label="文章資訊"
          className="sticky top-0 flex min-w-0 flex-col gap-4"
        >
          <AuthorCard post={post} />
          {!isAnnouncement && (
            <SeriesNav
              series={post.series}
              postId={post._id ?? ""}
              variant="desktop"
            />
          )}
          <TableOfContents headings={headings} activeId={activeId} />
        </aside>
      </div>
    </div>
  );
}

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
import { SigMorePosts } from "./SigMorePosts";
import Thread from "./Thread";

// Desktop post page (decision 6C, v4 3B): a sticky 目錄 on the left, the
// article at about 38 CJK characters per line, and a sticky right column
// (author, series, 同 SIG 的其他文章). 老師回饋 and the comments follow
// the article at its width. The window scrolls; the side columns stick
// under the header at `--shell-top`. Reader mode (`.layout-split`) hides
// the side columns (data-shell="aside") and the discussion
// (data-reader-hide).

export default function PostLayout({ post }: { post: TThread }) {
  const articleRef = useRef<HTMLElement>(null);
  const [bodyReady, setBodyReady] = useState(false);
  const { headings, activeId } = usePostHeadings(
    articleRef,
    bodyReady,
    post.title,
  );
  const isAnnouncement = post.sig === announcementSigId;

  const toc = <TableOfContents headings={headings} activeId={activeId} />;

  // Grid placement (v4 3B, decision 1B):
  // - ≥1440: 目錄 | article + discussion | author, series, other posts
  // - 1280–1439: article + discussion | the right column with 目錄 in it
  // - <1280: one column; the right column's cards follow the article
  //   (without 目錄), then the discussion.
  return (
    <div className="layout-split mx-auto grid w-[min(100%-3rem,96rem)] grid-cols-[minmax(0,46rem)] items-start justify-center gap-x-8 gap-y-5 min-[1280px]:grid-cols-[minmax(0,46rem)_18rem] min-[1440px]:grid-cols-[14rem_minmax(0,46rem)_18rem] min-[1440px]:justify-between">
      <aside
        data-shell="aside"
        aria-label="目錄"
        className="sticky top-[var(--shell-top,5.5rem)] col-start-1 row-span-2 row-start-1 hidden min-w-0 empty:hidden min-[1440px]:block"
      >
        {toc}
      </aside>
      <div
        data-split-main
        className="col-start-1 row-start-1 flex min-w-0 flex-col min-[1440px]:col-start-2"
      >
        <Thread
          post={post}
          articleRef={articleRef}
          onBodyReady={() => setBodyReady(true)}
        />
      </div>
      {/* After the post is in: rendered first, they jumped down when it
          arrived (and #feedback scrolled to the wrong place). */}
      {!isAnnouncement && bodyReady && (
        <div
          data-reader-hide
          className="col-start-1 row-start-3 flex min-w-0 flex-col gap-5 min-[1440px]:col-start-2 min-[1280px]:row-start-2"
        >
          {/* Private: only the author, the SIG's 指導老師 and admins */}
          <TeacherFeedback post={post} />
          {/* Comments failing to render must not take the post down */}
          <SectionErrorBoundary label="留言">
            <Comments post={post} />
          </SectionErrorBoundary>
        </div>
      )}
      <aside
        data-shell="aside"
        aria-label="文章資訊"
        className="col-start-1 row-start-2 grid min-w-0 gap-4 sm:grid-cols-2 min-[1280px]:sticky min-[1280px]:top-[var(--shell-top,5.5rem)] min-[1280px]:col-start-2 min-[1440px]:col-start-3 min-[1280px]:row-span-2 min-[1280px]:row-start-1 min-[1280px]:flex min-[1280px]:flex-col"
      >
        <AuthorCard post={post} />
        {!isAnnouncement && (
          <SeriesNav
            series={post.series}
            postId={post._id ?? ""}
            variant="desktop"
          />
        )}
        <div className="hidden empty:hidden min-[1280px]:block min-[1440px]:hidden">
          {toc}
        </div>
        <div className="sm:col-span-2">
          <SigMorePosts sigId={post.sig} postId={post._id ?? ""} />
        </div>
      </aside>
    </div>
  );
}

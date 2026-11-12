"use client";

import { useRef } from "react";
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { MarkdownView } from "@/components/Markdown/MarkdownView";
import useDuplicateTitle from "@/components/ReaderMode/useDuplicateTitle";
import { HashtagLinks } from "@/components/Threads/desktop/ThreadsList";
import type { TThread } from "@/interfaces/Thread";
import { postTags } from "@/modules/hashtag";

type Props = {
  post: TThread;
  isAnnouncement?: boolean;
  /** Called once the body is rendered. */
  onReady?: () => void;
};

export default function PostBody({ post, isAnnouncement, onReady }: Props) {
  const hashtags = postTags(post.hashtag);
  const showHashtags = !isAnnouncement && hashtags.length > 0;
  const rootRef = useRef<HTMLDivElement>(null);
  useDuplicateTitle(rootRef, post.title);

  return (
    <article
      ref={rootRef}
      className="flex flex-col gap-3 overflow-x-hidden rounded-card border border-line bg-paper px-4 pt-5 pb-6 shadow-card"
    >
      <h1 className="m-0 font-bold text-[1.375rem] text-ink-900 leading-[1.4] tracking-[0.01em]">
        {post.title}
      </h1>
      {showHashtags && (
        <HashtagLinks
          tags={hashtags}
          className="flex flex-wrap gap-1.5"
          chipClassName="py-1.5"
        />
      )}
      <div className="my-1 h-px w-full bg-line" />
      <SectionErrorBoundary label="文章內容">
        <MarkdownView markdown={post.content ?? ""} onReady={onReady} />
      </SectionErrorBoundary>
    </article>
  );
}

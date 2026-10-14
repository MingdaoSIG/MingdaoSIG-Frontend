"use client";

import { useRef } from "react";
import { MarkdownView } from "@/components/Markdown/MarkdownView";
import useDuplicateTitle from "@/components/ReaderMode/useDuplicateTitle";
import type { TThread } from "@/interfaces/Thread";

type Props = {
  post: TThread;
  isAnnouncement?: boolean;
};

export default function PostBody({ post, isAnnouncement }: Props) {
  const hashtags = post.hashtag ?? [];
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
        <div className="flex flex-wrap gap-1.5">
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-chip bg-brand-50 px-2 py-0.5 font-medium text-brand-800 text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="my-1 h-px w-full bg-line" />
      <MarkdownView markdown={post.content} />
    </article>
  );
}

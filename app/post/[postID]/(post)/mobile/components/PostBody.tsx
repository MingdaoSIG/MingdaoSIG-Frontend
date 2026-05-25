"use client";

import { MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/preview.css";
import "md-editor-rt/lib/style.css";
import "@/app/mdEditorConfig";

import type { TThread } from "@/interfaces/Thread";

type Props = {
  post: TThread;
  isAnnouncement?: boolean;
};

export default function PostBody({ post, isAnnouncement }: Props) {
  const hashtags = post.hashtag ?? [];
  const showHashtags = !isAnnouncement && hashtags.length > 0;

  return (
    <div className="flex flex-col gap-2.5 overflow-x-hidden rounded-2xl bg-white/70 p-4 backdrop-blur-md">
      <h2 className="m-0 font-bold text-[22px] text-md-dark-green leading-tight">
        {post.title}
      </h2>
      {showHashtags && (
        <div className="flex flex-wrap gap-1.5">
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#5FCDF5] px-2.5 py-0.5 font-semibold text-[11px] text-white"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      {!isAnnouncement && <div className="my-1 h-px w-full bg-black/10" />}
      <MdPreview value={post.content} language="en-US" previewTheme="github" />
    </div>
  );
}

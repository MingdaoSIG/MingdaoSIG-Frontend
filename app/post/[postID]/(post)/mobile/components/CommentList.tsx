"use client";

import { MessageCircle } from "lucide-react";

import { CommentThread } from "../../components/CommentView";
import type { CommentsController } from "../../components/useComments";

type Props = {
  controller: CommentsController;
};

function CommentSkeleton() {
  return (
    <div
      className="flex animate-pulse gap-2.5 rounded-card border border-line bg-surface p-3"
      aria-busy="true"
    >
      <div className="h-9 w-9 flex-shrink-0 rounded-full bg-field" />
      <div className="flex-1 space-y-2">
        <div className="h-2.5 w-20 rounded bg-field" />
        <div className="h-2 w-full rounded bg-field" />
        <div className="h-2 w-3/5 rounded bg-field" />
      </div>
    </div>
  );
}

export default function CommentList({ controller }: Props) {
  const { comments, isLoading, count } = controller;
  // Newest first (the backend sends them so; keep it if it ever does not).
  const sorted = comments
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );

  return (
    <section
      id="comments-section"
      aria-labelledby="comments-heading"
      className="mb-2 flex flex-col gap-2 px-1"
    >
      <div className="flex items-baseline gap-2 px-1 pt-2">
        <h3
          id="comments-heading"
          className="m-0 font-bold text-base text-ink-900"
        >
          留言
        </h3>
        <span className="text-ink-500 text-xs">{count} 則</span>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      ) : comments.length === 0 ? (
        <output className="rounded-card border border-line bg-surface p-8 text-center">
          <MessageCircle
            size={28}
            className="mx-auto mb-2 text-ink-400"
            aria-hidden
          />
          <div className="font-semibold text-ink-900 text-sm">尚無留言</div>
          <div className="mt-1 text-ink-500 text-xs">搶先留下你的想法吧！</div>
        </output>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((c) => (
            <CommentThread
              key={c._id}
              comment={c}
              controller={controller}
              variant="mobile"
            />
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import type { TComments } from "@/interfaces/comments";

import CommentItem from "./CommentItem";

type Props = {
  comments: TComments[];
  isLoading: boolean;
  onReply: (comment: TComments) => void;
};

function CommentSkeleton({ small = false }: { small?: boolean }) {
  return (
    <div
      className={
        small
          ? "ml-6 flex animate-pulse gap-2 rounded-xl bg-white/55 p-2.5"
          : "flex animate-pulse gap-2.5 rounded-2xl bg-white/70 p-3"
      }
      aria-busy="true"
    >
      <div
        className="flex-shrink-0 rounded-full bg-white/80"
        style={{
          width: small ? 28 : 36,
          height: small ? 28 : 36,
        }}
      />
      <div className="flex-1 space-y-2">
        <div className="h-2.5 w-20 rounded bg-white/80" />
        <div className="h-2 w-full rounded bg-white/80" />
        <div className="h-2 w-3/5 rounded bg-white/80" />
      </div>
    </div>
  );
}

export default function CommentList({ comments, isLoading, onReply }: Props) {
  const topLevel = comments
    .filter((c) => !c.reply)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );

  const repliesByParent = new Map<string, TComments[]>();
  for (const comment of comments) {
    if (comment.reply) {
      const arr = repliesByParent.get(comment.reply) ?? [];
      arr.push(comment);
      repliesByParent.set(comment.reply, arr);
    }
  }
  for (const arr of Array.from(repliesByParent.values())) {
    arr.sort(
      (a: TComments, b: TComments) =>
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime(),
    );
  }

  return (
    <section
      id="comments-section"
      aria-labelledby="comments-heading"
      className="flex flex-col gap-2 px-1"
    >
      <div className="flex items-baseline gap-2 px-1 pt-2">
        <h3
          id="comments-heading"
          className="m-0 font-bold text-base text-md-dark-green"
        >
          留言
        </h3>
        <span className="text-gray-500 text-xs">{comments.length} 則</span>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <CommentSkeleton />
          <CommentSkeleton small />
          <CommentSkeleton />
        </div>
      ) : comments.length === 0 ? (
        <output className="rounded-2xl bg-white/55 p-8 text-center backdrop-blur-md">
          <div className="mb-2 text-3xl">💬</div>
          <div className="font-semibold text-[13px] text-md-dark-green">
            尚無留言
          </div>
          <div className="mt-1 text-[11px] text-gray-600">
            搶先留下你的想法吧！
          </div>
        </output>
      ) : (
        <div className="flex flex-col gap-2">
          {topLevel.map((top) => (
            <div key={top._id} className="flex flex-col gap-2">
              <CommentItem comment={top} variant="top" onReply={onReply} />
              {(repliesByParent.get(top._id) ?? []).map((reply) => (
                <CommentItem key={reply._id} comment={reply} variant="reply" />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

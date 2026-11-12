"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { cardTime, isThread } from "@/components/PostCard/post";
import type { TThread } from "@/interfaces/Thread";
import { apiRequest } from "@/modules/api/client";
import useSig from "@/utils/useSig";

// 「同 SIG 的其他文章」 in the post page's right column (v4 3B): the SIG's
// newest posts without this one, so a reader has somewhere to go next.

const SHOWN = 6;

export function SigMorePosts({
  sigId,
  postId,
}: {
  sigId: string;
  postId: string;
}) {
  const { data: sig } = useSig(sigId);
  const list = useQuery<TThread[]>({
    queryKey: ["sigMorePosts", sigId],
    queryFn: async ({ signal }) => {
      // One extra, in case this post is among them.
      const result = await apiRequest<unknown[]>(`/post/list/sig/${sigId}`, {
        query: { skip: 0, limit: SHOWN + 1 },
        signal,
      });
      return result.ok && Array.isArray(result.data)
        ? result.data.filter(isThread)
        : [];
    },
    enabled: Boolean(sigId),
    staleTime: 5 * 60 * 1000,
  });
  const posts = (list.data ?? [])
    .filter((post) => post._id !== postId)
    .slice(0, SHOWN);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="sig-more-title"
      className="rounded-card border border-line bg-surface py-3 shadow-card"
      data-sig-more
    >
      <h2
        id="sig-more-title"
        className="px-4 pb-1.5 font-bold text-ink-900 text-sm"
      >
        同 SIG 的其他文章
      </h2>
      <ul className="flex flex-col px-2">
        {posts.map((post) => (
          <li key={post._id}>
            <Link
              href={`/post/${post._id}`}
              className="block rounded-control px-2 py-1.5 transition-colors hover:bg-field"
            >
              <span className="line-clamp-2 break-words text-[13px] text-ink-800 leading-5">
                {post.title || "（無標題）"}
              </span>
              <span className="block text-ink-500 text-xs">
                {[cardTime(post.createdAt), `${post.likes ?? 0} 讚`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {sig?.customId && (
        <Link
          href={`/@${sig.customId}`}
          className="mx-4 mt-1 block font-semibold text-brand-700 text-xs hover:underline"
        >
          查看 {sig.name} 的全部文章
        </Link>
      )}
    </section>
  );
}

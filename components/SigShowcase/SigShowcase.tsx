"use client";

import { Eye, Heart, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { TFeaturedPost } from "@/interfaces/Engagement";
import { imageUrl } from "@/modules/imageUrl";

// 精選成果 (design/api-contract-v4.md §3.4): up to six posts the SIG's
// managers picked, in their order, as a strip of cover cards. Renders
// nothing when there are none.

function isFeaturedPost(value: unknown): value is TFeaturedPost {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TFeaturedPost)._id === "string"
  );
}

/**
 * The resolved showcase posts of a SIG read. `/sig/list` and the answer
 * of `POST /sig/:id` carry plain ids instead; those are left out.
 */
export function featuredPostsOf(
  sig: { featuredPosts?: unknown } | null | undefined,
): TFeaturedPost[] {
  const list = sig?.featuredPosts;
  return Array.isArray(list) ? list.filter(isFeaturedPost) : [];
}

function formatCount(value: number | undefined) {
  return (value ?? 0).toLocaleString("zh-TW");
}

export function SigShowcase({
  posts,
  title = "精選成果",
  variant = "desktop",
}: {
  posts: TFeaturedPost[];
  title?: string;
  variant?: "desktop" | "mobile";
}) {
  if (posts.length === 0) {
    return null;
  }
  const mobile = variant === "mobile";

  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-2">
      <h2 className="flex items-center gap-1.5 font-bold text-base text-ink-900">
        <Sparkles size={17} aria-hidden className="text-warm-600" />
        {title}
      </h2>
      <ul
        className={`grid snap-x snap-mandatory grid-flow-col gap-3 overflow-x-auto p-0.5 ${
          mobile
            ? "scrollbar-hide auto-cols-[62%] pb-1"
            : "custom-scrollbar auto-cols-[15rem] pb-2"
        }`}
      >
        {posts.map((post) => {
          const cover = imageUrl(post.cover);
          return (
            <li key={post._id} className="min-w-0 snap-start">
              <Link
                href={`/post/${post._id}`}
                className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="relative aspect-[2/1] w-full bg-brand-50">
                  {cover ? (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes={mobile ? "62vw" : "15rem"}
                      className="object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center font-bold text-3xl text-brand-700/40"
                    >
                      {post.title.trim().charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
                  <h3 className="line-clamp-2 font-semibold text-[15px] text-ink-900 leading-snug group-hover:underline">
                    {post.title}
                  </h3>
                  <p className="mt-auto flex items-center gap-2.5 text-ink-500 text-xs">
                    {post.user?.name && (
                      <span className="min-w-0 truncate">{post.user.name}</span>
                    )}
                    <span className="flex shrink-0 items-center gap-0.5">
                      <Heart size={12} aria-hidden />
                      <span className="sr-only">讚</span>
                      {formatCount(post.likes)}
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5">
                      <Eye size={12} aria-hidden />
                      <span className="sr-only">瀏覽</span>
                      {formatCount(post.views)}
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

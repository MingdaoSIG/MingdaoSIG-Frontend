"use client";

import { Eye, Heart, MessageCircle, Pin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { BookmarkButton } from "@/components/Bookmark/BookmarkButton";
import { postSummary } from "@/components/Threads/postSummary";
import type { Sig } from "@/interfaces/Sig";
import type { TThread } from "@/interfaces/Thread";
import { postTags, tagHref } from "@/modules/hashtag";
import { imageUrl } from "@/modules/imageUrl";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import { formatViews } from "@/modules/views";
import { useSigDirectory } from "@/utils/useAdminAccess";
import useIsMobile from "@/utils/useIsMobile";
import { cardTime, isAnnouncementPost, postAuthorOf, postSigOf } from "./post";

// The post card of the 2026 user-side redesign (decision 4B): text first
// (title, a two-line excerpt, SIG colour dot + SIG name, author, time,
// counts, tags) with a small thumbnail on the right when the post has a
// cover. `featured` (pinned / showcased posts) puts the cover on top as a
// big image instead. One component for desktop and phones.

export type PostCardVariant = "compact" | "featured";

export type PostCardProps = {
  post: TThread;
  /** "featured": the cover as a big image on top (pinned / featured). */
  variant?: PostCardVariant;
  /** Adds 「置頂」 before the title. */
  pinned?: boolean;
  /** Load the image eagerly (the first cards of a list). */
  eager?: boolean;
  /** Hide the SIG in the meta line (lists of one SIG). */
  hideSig?: boolean;
  className?: string;
};

/** The SIG colour as a small dot (cards, chips, the side rail). */
export function SigDot({
  color,
  className = "",
}: {
  color: string | undefined;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block size-2 shrink-0 rounded-full ${className}`}
      style={{ backgroundColor: color ?? BRAND_COLOR }}
    />
  );
}

/** 「置頂」 before the title of a pinned post. */
export function PinnedChip() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-chip bg-brand-50 px-1.5 py-0.5 font-semibold text-brand-800 text-xs leading-4">
      <Pin size={12} aria-hidden strokeWidth={2.4} />
      置頂
    </span>
  );
}

function AnnouncementChip() {
  return (
    <span className="shrink-0 rounded-chip bg-warm-600/10 px-1.5 py-0.5 font-semibold text-warm-600 text-xs leading-4">
      公告
    </span>
  );
}

/**
 * Colour and address of a SIG from the shared `/sig/list` cache: list
 * items carry only `{ _id, name }`.
 */
function useSigInfo(sig: Pick<Sig, "_id" | "color" | "customId"> | null) {
  const directory = useSigDirectory();
  return useMemo(() => {
    const listed = sig?._id
      ? directory.data?.find((item) => item._id === sig._id)
      : undefined;
    return {
      color: resolveSigColor(sig?.color ? sig : (listed ?? sig ?? undefined)),
      customId: sig?.customId || listed?.customId || "",
    };
  }, [sig, directory.data]);
}

function Count({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1" title={label}>
      {icon}
      <span>
        {label === "瀏覽數" ? formatViews(value) : value}
        <span className="sr-only">{` ${label}`}</span>
      </span>
    </span>
  );
}

export function PostCard({
  post,
  variant = "compact",
  pinned = false,
  eager = false,
  hideSig = false,
  className = "",
}: PostCardProps) {
  const isMobile = useIsMobile();
  const sig = postSigOf(post);
  const author = postAuthorOf(post);
  const sigInfo = useSigInfo(sig);
  const announcement = isAnnouncementPost(post);
  const cover =
    !announcement && typeof post.cover === "string"
      ? imageUrl(post.cover)
      : undefined;
  const featured = variant === "featured" && Boolean(cover);
  const tags = announcement ? [] : postTags(post.hashtag);
  const summary = postSummary(post);
  const time = cardTime(post.createdAt);
  const likes = typeof post.likes === "number" ? post.likes : 0;
  const comments = typeof post.comments === "number" ? post.comments : 0;

  // The title link covers the whole card (its ::after); the SIG, tag and
  // bookmark controls sit above it (z-[1]) so links never nest.
  return (
    <article
      data-post-card={post._id}
      data-variant={featured ? "featured" : "compact"}
      className={`relative overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover ${
        announcement ? "shadow-[inset_3px_0_0_var(--color-warm-600)]" : ""
      } ${className}`}
    >
      {featured && cover && (
        <div className="relative aspect-[2.6/1] w-full bg-field">
          <Image
            src={cover}
            alt=""
            fill
            priority={eager}
            sizes="(min-width: 1024px) 48rem, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex gap-3 p-4 lg:gap-4 lg:px-5">
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="flex min-w-0 items-start gap-1.5 font-semibold text-[1.0625rem] text-ink-900 leading-snug tracking-[0.01em] lg:text-lg">
            {(pinned || announcement) && (
              <span className="mt-0.5 flex shrink-0 gap-1">
                {pinned && <PinnedChip />}
                {announcement && <AnnouncementChip />}
              </span>
            )}
            <Link
              href={`/post/${post._id}`}
              className="line-clamp-2 [overflow-wrap:anywhere] after:absolute after:inset-0 after:content-['']"
            >
              {post.title}
            </Link>
          </h2>
          {summary && (
            <p
              className={`mt-1 text-[0.9rem] text-ink-700 leading-relaxed [overflow-wrap:anywhere] ${
                announcement ? "line-clamp-3" : "line-clamp-2"
              }`}
            >
              {summary}
            </p>
          )}
          <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[13px] text-ink-500 leading-5">
            {!announcement && !hideSig && sig?.name && (
              <>
                <SigDot color={sigInfo.color} />
                {sigInfo.customId ? (
                  <Link
                    href={`/@${sigInfo.customId}`}
                    className="sig-text relative z-[1] min-w-0 max-w-[45%] shrink truncate font-semibold hover:underline"
                    style={{
                      ["--sig-color" as string]: sigInfo.color ?? BRAND_COLOR,
                    }}
                  >
                    {sig.name}
                  </Link>
                ) : (
                  <span
                    className="sig-text min-w-0 max-w-[45%] shrink truncate font-semibold"
                    style={{
                      ["--sig-color" as string]: sigInfo.color ?? BRAND_COLOR,
                    }}
                  >
                    {sig.name}
                  </span>
                )}
                <span aria-hidden>·</span>
              </>
            )}
            {!announcement && author?.name && (
              <>
                <span className="min-w-0 truncate">{author.name}</span>
                <span aria-hidden>·</span>
              </>
            )}
            {time && (
              <time
                dateTime={post.createdAt}
                title={new Date(post.createdAt ?? "").toLocaleString("zh-TW")}
                className="shrink-0"
              >
                {time}
              </time>
            )}
          </p>
          {!announcement && (
            <div className="mt-1.5 flex min-w-0 items-center gap-3 text-[13px] text-ink-500 leading-5">
              <Count
                icon={<Heart size={14} aria-hidden />}
                value={likes}
                label="按讚數"
              />
              <Count
                icon={<MessageCircle size={14} aria-hidden />}
                value={comments}
                label="留言數"
              />
              {typeof post.views === "number" && (
                <Count
                  icon={<Eye size={14} aria-hidden />}
                  value={post.views}
                  label="瀏覽數"
                />
              )}
              {/* One line of tags; the ones that do not fit wrap out of
                  sight instead of squeezing the counts. */}
              <span className="flex h-[1.375rem] min-w-0 flex-1 flex-wrap gap-1.5 overflow-hidden">
                {tags.slice(0, 4).map((tag) => {
                  const href = tagHref(tag);
                  return href ? (
                    <Link
                      key={tag}
                      href={href}
                      className="relative z-[1] max-w-[10rem] truncate whitespace-nowrap rounded-chip bg-brand-50 px-1.5 py-0.5 font-medium text-brand-800 text-xs transition-colors hover:bg-[color-mix(in_srgb,var(--color-brand-700)_16%,white)]"
                    >
                      #{tag}
                    </Link>
                  ) : null;
                })}
              </span>
              <BookmarkButton
                postId={post._id}
                size={isMobile ? "touch" : "card"}
                className={isMobile ? "-my-3 -mr-3" : "-my-1.5 -mr-2"}
              />
            </div>
          )}
        </div>
        {!featured && cover && (
          <div className="relative h-[4.5rem] w-[5.5rem] shrink-0 self-start overflow-hidden rounded-control bg-field lg:h-[5.75rem] lg:w-[8.5rem]">
            <Image
              src={cover}
              alt=""
              fill
              priority={eager}
              sizes="(min-width: 1024px) 136px, 88px"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </article>
  );
}

/** Placeholder with the compact card's shape. */
export function PostCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex animate-pulse gap-3 rounded-card border border-line bg-surface p-4 shadow-card lg:gap-4 lg:px-5"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="h-5 w-2/3 rounded-chip bg-field" />
        <div className="h-4 w-full rounded-chip bg-field" />
        <div className="h-4 w-5/6 rounded-chip bg-field" />
        <div className="mt-1 h-3.5 w-40 rounded-chip bg-field" />
      </div>
      <div className="h-[4.5rem] w-[5.5rem] shrink-0 rounded-control bg-field lg:h-[5.75rem] lg:w-[8.5rem]" />
    </div>
  );
}

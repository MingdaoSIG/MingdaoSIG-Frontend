"use client";

import { ArrowRight, Eye, Heart, Library, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SplitBlock from "@/app/(Layout)/splitBlock";
import { NotFound } from "@/components/NotFound";
import { postSummary } from "@/components/Threads/postSummary";
import type { TSeries, TSeriesUser } from "@/interfaces/Reading";
import type { TThread } from "@/interfaces/Thread";
import { ApiError, getErrorMessage } from "@/modules/api/client";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";
import { useSeries } from "@/modules/series";
import { formatViews } from "@/modules/views";
import useIsMobile from "@/utils/useIsMobile";
import useUser from "@/utils/useUser";
import { useUserAccount } from "@/utils/useUserAccount";

function authorOf(series: TSeries): {
  id: string | undefined;
  user: TSeriesUser | null;
} {
  const user = series.user;
  if (typeof user === "string") {
    return { id: user, user: null };
  }
  return { id: user?._id, user: user ?? null };
}

function postsOf(series: TSeries): TThread[] {
  return series.posts.filter(
    (post): post is TThread => typeof post === "object" && post !== null,
  );
}

function formatDate(value: string | undefined) {
  const date = new Date(value ?? "");
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("zh-TW");
}

function Author({ series }: { series: TSeries }) {
  const author = authorOf(series);
  // The backend sends the public user; fall back to looking the id up.
  const { data: fetched } = useUser(author.user?.name ? undefined : author.id);
  const user = author.user?.name ? author.user : (fetched ?? author.user);
  if (!user) {
    return null;
  }
  const content = (
    <>
      <Image
        src={imageUrl(user.avatar) ?? DEFAULT_AVATAR_URL}
        width={40}
        height={40}
        alt=""
        unoptimized
        className="size-10 shrink-0 rounded-full object-cover"
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-semibold text-ink-900 text-sm">
          {user.name || (user.customId ? `@${user.customId}` : "作者")}
        </span>
        {user.customId && (
          <span className="truncate text-ink-500 text-xs">
            @{user.customId}
          </span>
        )}
      </span>
    </>
  );
  return user.customId ? (
    <Link
      href={`/@${user.customId}`}
      className="flex min-w-0 items-center gap-3 rounded-control hover:underline"
    >
      {content}
    </Link>
  ) : (
    <div className="flex min-w-0 items-center gap-3">{content}</div>
  );
}

function PostRow({
  post,
  index,
  mobile,
}: {
  post: TThread;
  index: number;
  mobile: boolean;
}) {
  return (
    <li className="relative flex gap-4 rounded-card border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-card-hover">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-brand-50 font-bold text-brand-800 text-sm tabular-nums">
        {index + 1}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="font-semibold text-ink-900 leading-snug">
          <Link
            href={`/post/${post._id}`}
            className={`after:absolute after:inset-0 after:content-[''] ${
              mobile ? "line-clamp-2" : "line-clamp-1"
            }`}
          >
            {post.title || "（無標題）"}
          </Link>
        </h2>
        <p className="line-clamp-2 text-[0.9375rem] text-ink-700 leading-[1.7]">
          {postSummary(post)}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-500">
          <span>{formatDate(post.createdAt)}</span>
          <span className="flex items-center gap-1">
            <Heart size={14} aria-label="按讚數" />
            {post.likes ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={14} aria-label="留言數" />
            {post.comments ?? 0}
          </span>
          {typeof post.views === "number" && (
            <span className="flex items-center gap-1">
              <Eye size={14} aria-label="瀏覽數" />
              {formatViews(post.views)}
            </span>
          )}
        </p>
      </div>
    </li>
  );
}

function Header({ series, mobile }: { series: TSeries; mobile: boolean }) {
  const posts = postsOf(series);
  const { userData } = useUserAccount();
  const author = authorOf(series);
  const isOwn = Boolean(author.id) && author.id === userData?._id;
  return (
    <header
      className={`flex flex-col gap-3 rounded-card border border-line bg-paper shadow-card ${
        mobile ? "p-4" : "px-6 py-5"
      }`}
    >
      <p className="flex items-center gap-1.5 font-semibold text-brand-700 text-xs">
        <Library aria-hidden className="size-4" />
        系列 · {posts.length} 篇
      </p>
      <h1
        className={`font-bold text-ink-900 leading-[1.4] ${
          mobile ? "text-[1.375rem]" : "text-2xl"
        }`}
      >
        {series.title || "未命名的系列"}
      </h1>
      {series.description && (
        <p className="whitespace-pre-line text-ink-700 leading-7">
          {series.description}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {mobile && <Author series={series} />}
        <span className="flex-1" />
        {isOwn && authorOf(series).user?.customId && (
          <Link
            href={`/@${authorOf(series).user?.customId}?tab=series`}
            className={`flex items-center rounded-control border border-line-strong bg-surface px-3.5 font-semibold text-ink-700 text-sm hover:bg-field ${
              mobile ? "h-11" : "h-9"
            }`}
          >
            管理系列
          </Link>
        )}
        {posts[0] && (
          <Link
            href={`/post/${posts[0]._id}`}
            className={`flex items-center gap-1.5 rounded-control bg-brand-700 px-4 font-semibold text-sm text-white hover:bg-brand-800 ${
              mobile ? "h-11" : "h-9"
            }`}
          >
            從第一篇開始讀
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>
    </header>
  );
}

function List({ series, mobile }: { series: TSeries; mobile: boolean }) {
  const posts = postsOf(series);
  if (posts.length === 0) {
    return (
      <p className="rounded-card border border-line bg-surface p-8 text-center text-ink-500 shadow-card">
        這個系列還沒有文章
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-3" aria-label="系列文章">
      {posts.map((post, index) => (
        <PostRow key={post._id} post={post} index={index} mobile={mobile} />
      ))}
    </ol>
  );
}

export default function SeriesPage({ id }: { id: string }) {
  const isMobile = useIsMobile();
  const { data, isPending, error, refetch } = useSeries(id);

  if (error instanceof ApiError && error.kind === "not-found") {
    return (
      <NotFound
        content={{ message: "找不到這個系列" }}
        image={{ show: false }}
      />
    );
  }

  const body = isPending ? (
    <div className="flex flex-col gap-3" aria-busy>
      <div className="h-36 animate-pulse rounded-card border border-line bg-surface" />
      <div className="h-24 animate-pulse rounded-card border border-line bg-surface" />
      <div className="h-24 animate-pulse rounded-card border border-line bg-surface" />
    </div>
  ) : error || !data ? (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface p-8 text-ink-700 shadow-card"
    >
      <p>{getErrorMessage(error)}</p>
      <button
        type="button"
        className="h-10 cursor-pointer rounded-control border border-line-strong bg-surface px-4 text-sm hover:bg-field"
        onClick={() => refetch()}
      >
        重試
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      <Header series={data} mobile={isMobile} />
      <List series={data} mobile={isMobile} />
    </div>
  );

  if (isMobile) {
    return (
      <div className="scrollbar-hide h-dvh overflow-y-auto px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {body}
      </div>
    );
  }
  return (
    <SplitBlock>
      {body}
      <div className="flex flex-col gap-4">
        {data && (
          <div className="glass flex flex-col gap-3 rounded-card px-5 py-4">
            <p className="font-semibold text-ink-500 text-xs">作者</p>
            <Author series={data} />
          </div>
        )}
      </div>
    </SplitBlock>
  );
}

"use client";

import { Pin, Share2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { RefObject } from "react";
import Swal from "sweetalert2";
import { BookmarkButton } from "@/components/Bookmark/BookmarkButton";
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { MarkdownView } from "@/components/Markdown/MarkdownView";
import ReaderMode from "@/components/ReaderMode";
import ReaderByline from "@/components/ReaderMode/Byline";
import useDuplicateTitle from "@/components/ReaderMode/useDuplicateTitle";
import { useReport } from "@/components/Report/ReportDialog";
import { announcementSigId } from "@/components/Threads/configs/announcement";
import { HashtagLinks } from "@/components/Threads/desktop/ThreadsList";
import type { TThread } from "@/interfaces/Thread";
import { postTags } from "@/modules/hashtag";
import { formatViews } from "@/modules/views";
import { promptLogin } from "@/utils/loginPrompt";
import { notice } from "@/utils/notice";
import { useUserAccount } from "@/utils/useUserAccount";
import { confirmDeletePost } from "../components/confirmDeletePost";
import { PostMoreMenu } from "../components/PostMoreMenu";
import { sharePost } from "../components/sharePost";
import { usePostLike } from "../components/usePostLike";
import { usePostPermissions } from "../components/usePostPermissions";

// The reading column of the desktop post page (decision 6C): title, date
// and views, tags, the action row (讚 / 收藏 / 分享 / 閱讀模式, and 編輯 /
// 刪除 / ⋯), then the post. Announcements have no 讚; they keep every
// other action.

function formatDate(value: string | undefined) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
}

export default function Thread({
  post,
  articleRef,
  onBodyReady,
}: {
  post: TThread;
  articleRef: RefObject<HTMLElement | null>;
  /** The Markdown is in the DOM (the table of contents reads it). */
  onBodyReady?: () => void;
}) {
  const { isLogin, userData, token, login } = useUserAccount();
  const route = useRouter();
  const report = useReport();
  const isAnnouncement = post.sig === announcementSigId;
  useDuplicateTitle(articleRef, post.title);
  const like = usePostLike(post, {
    onLoginNeeded: () => promptLogin(login, { text: "登入後即可按讚" }),
    onError: (message, wasLiking) =>
      Swal.fire({
        title: wasLiking ? "按讚失敗" : "取消按讚失敗",
        text: message,
        icon: "error",
        confirmButtonText: "好",
        confirmButtonColor: "#0b5a83",
      }),
  });

  const authorId =
    typeof post.user === "string"
      ? post.user
      : (post.user as { _id?: string } | null)?._id;
  const isOwnPost = isLogin && Boolean(authorId) && authorId === userData?._id;
  const { canEdit, canDelete } = usePostPermissions(post);
  const tags = isAnnouncement ? [] : postTags(post.hashtag);
  const date = formatDate(post.createdAt);

  async function onShare() {
    const result = await sharePost(post.title);
    if (result === "copied") {
      notice("success", "已複製連結");
    } else if (result === "failed") {
      notice("error", "無法複製連結");
    }
  }

  const iconButton =
    "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control transition-colors hover:bg-field";
  const textButton =
    "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-control px-2.5 font-semibold text-ink-700 text-sm transition-colors hover:bg-field";

  return (
    <article
      ref={articleRef}
      aria-labelledby="post-title"
      className="post-body min-w-0"
      data-post-article
    >
      <header
        data-reader-title
        className="mx-auto flex w-full max-w-[42rem] flex-col gap-3"
      >
        {(isAnnouncement || post.pinned) && (
          <div data-reader-hide className="flex flex-wrap gap-1.5">
            {isAnnouncement && (
              <span className="rounded-chip bg-warm-600/10 px-1.5 py-0.5 font-semibold text-warm-600 text-xs">
                公告
              </span>
            )}
            {post.pinned && (
              <span className="inline-flex items-center gap-1 rounded-chip bg-brand-50 px-1.5 py-0.5 font-semibold text-brand-800 text-xs">
                <Pin aria-hidden className="size-3" />
                置頂
              </span>
            )}
          </div>
        )}
        <h1
          id="post-title"
          className="break-words font-bold text-[1.75rem] text-ink-900 leading-[1.4] tracking-[0.01em]"
        >
          {post.title}
        </h1>
        <p
          data-reader-hide
          className="flex flex-wrap items-center gap-x-2 text-[13px] text-ink-500"
        >
          {date && <time dateTime={post.createdAt}>{date}</time>}
          {typeof post.views === "number" && (
            <>
              {date && (
                <span aria-hidden className="text-ink-400">
                  ·
                </span>
              )}
              <span data-views>{formatViews(post.views)} 次瀏覽</span>
            </>
          )}
        </p>
        {tags.length > 0 && (
          <div data-reader-hide>
            <HashtagLinks tags={tags} className="flex flex-wrap gap-1.5" />
          </div>
        )}
        <div
          data-post-actions
          className="mt-1 flex flex-wrap items-center gap-1 border-line border-y py-1.5"
        >
          {!isAnnouncement && (
            <button
              type="button"
              data-reader-hide
              className={textButton}
              onClick={like.toggle}
              aria-label={`${like.liked ? "取消喜歡" : "喜歡"}（${like.count} 個讚）`}
              aria-pressed={like.liked}
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 32 32"
                fill="none"
              >
                <path
                  d="M26.9399 6.38798C26.2047 5.64761 25.3304 5.05985 24.3673 4.65849C23.4042 4.25714 22.3713 4.05012 21.3279 4.04932C19.3543 4.04964 17.4528 4.79101 15.9999 6.12665C14.5471 4.79079 12.6455 4.04938 10.6719 4.04932C9.62728 4.0504 8.59319 4.25806 7.62914 4.66034C6.66509 5.06262 5.79011 5.65158 5.05456 6.39332C1.91723 9.54398 1.91856 14.472 5.05723 17.6093L15.9999 28.552L26.9426 17.6093C30.0812 14.472 30.0826 9.54398 26.9399 6.38798Z"
                  fill={like.liked ? "#EE5757" : "#BDBDBD"}
                />
              </svg>
              <span
                className={`min-w-[1ch] tabular-nums ${
                  like.liked ? "text-[#c53d3d]" : ""
                }`}
              >
                {like.count}
              </span>
            </button>
          )}
          <span data-reader-hide className="contents">
            <BookmarkButton postId={post._id} size="toolbar" />
          </span>
          <button
            type="button"
            data-reader-hide
            className={textButton}
            onClick={onShare}
          >
            <Share2 aria-hidden className="size-[18px]" />
            分享
          </button>
          <ReaderMode title={post.title} />
          <span data-reader-hide className="flex-1" />
          {canEdit && (
            <button
              type="button"
              data-reader-hide
              className={iconButton}
              onClick={() => route.push(`/post/${post._id}/edit`)}
              aria-label="編輯貼文"
              title="編輯貼文"
            >
              <Image src="/icons/edit.svg" width={22} height={22} alt="" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              data-reader-hide
              className={iconButton}
              onClick={() =>
                confirmDeletePost(post._id, token, (href) => route.push(href))
              }
              aria-label="刪除貼文"
              title="刪除貼文"
            >
              <Image src="/icons/delete.svg" width={22} height={22} alt="" />
            </button>
          )}
          <PostMoreMenu
            onReport={
              isOwnPost
                ? undefined
                : () =>
                    report.open({ kind: "post", id: post._id ?? "" }, post.title)
            }
          />
        </div>
      </header>
      <ReaderByline post={post} />
      <div className="mt-8">
        <SectionErrorBoundary label="文章內容">
          <MarkdownView markdown={post.content ?? ""} onReady={onBodyReady} />
        </SectionErrorBoundary>
      </div>
      {report.dialog}
    </article>
  );
}

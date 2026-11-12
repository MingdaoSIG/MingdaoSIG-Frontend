"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { MarkdownView } from "@/components/Markdown/MarkdownView";
import ReaderMode from "@/components/ReaderMode";
import ReaderByline from "@/components/ReaderMode/Byline";
import useDuplicateTitle from "@/components/ReaderMode/useDuplicateTitle";
import type { TThread } from "@/interfaces/Thread";
import { apiRequest } from "@/modules/api/client";
import { promptLogin } from "@/utils/loginPrompt";
import useUser from "@/utils/useUser";
import { useUserAccount } from "@/utils/useUserAccount";
import { confirmDeletePost } from "../components/confirmDeletePost";
import { usePostPermissions } from "../components/usePostPermissions";

/** Author and date under an announcement's title (posts show them in the side card). */
function AnnouncementMeta({ post }: { post: TThread }) {
  const { data: user } = useUser(post.user);
  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("zh-TW")
    : "";
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-500">
      <span className="rounded-chip bg-warm-600/10 px-1.5 py-0.5 font-semibold text-warm-600 text-xs">
        公告
      </span>
      {user?.customId && (
        <Link
          href={`/@${user.customId}`}
          className="font-semibold text-ink-700 hover:underline"
        >
          {user.name || `@${user.customId}`}
        </Link>
      )}
      {date && <time dateTime={post.createdAt}>{date}</time>}
    </p>
  );
}

const Thread = ({ post }: { post: TThread }) => {
  const { isLogin, isLoading, token, userData, login } = useUserAccount();

  const [like, setLike] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState(
    post.likes ?? post.like?.length ?? 0,
  );
  const [liking, setLiking] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  useDuplicateTitle(rootRef, post.title);

  const route = useRouter();

  async function onLike() {
    if (isLoading || liking) {
      return;
    }
    if (!isLogin) {
      promptLogin(login, { text: "登入後即可按讚" });
      return;
    }
    // Show the change at once, and undo it if the server refuses.
    const willLike = !like;
    setLike(willLike);
    setLikeCount((count) => count + (willLike ? 1 : -1));
    setLiking(true);
    const res = await apiRequest(`/post/${post._id}/like`, {
      method: willLike ? "POST" : "DELETE",
      token,
    });
    setLiking(false);
    if (!res.ok) {
      setLike(!willLike);
      setLikeCount((count) => count + (willLike ? -1 : 1));
      Swal.fire({
        title: willLike ? "按讚失敗" : "取消按讚失敗",
        text: res.message,
        icon: "error",
        confirmButtonText: "好",
      });
    }
  }

  function onEdit() {
    route.push(`/post/${post._id}/edit`);
  }

  function onDelete() {
    confirmDeletePost(post._id, token, (href) => route.push(href));
  }

  useEffect(() => {
    if (isLogin) {
      post.like?.includes(userData?._id ?? "") ? setLike(true) : setLike(false);
    }
  }, [isLogin, post.like, userData?._id]);

  const { canEdit, canDelete } = usePostPermissions(post);
  const iconButton =
    "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control transition-colors hover:bg-field";

  const editButton = canEdit && (
    <button
      type="button"
      data-reader-hide
      className={iconButton}
      onClick={onEdit}
      aria-label="編輯貼文"
    >
      <Image src="/icons/edit.svg" width={26} height={26} alt="" />
    </button>
  );
  const deleteButton = canDelete && (
    <button
      type="button"
      data-reader-hide
      className={iconButton}
      onClick={onDelete}
      aria-label="刪除貼文"
    >
      <Image src="/icons/delete.svg" width={26} height={26} alt="" />
    </button>
  );

  if (post.sig === "652d60b842cdf6a660c2b778") {
    // Announcements have no like button; edit and delete follow the same
    // rules as any other post.
    return (
      <article
        ref={rootRef}
        className="layout-doc mx-auto flex h-full min-h-0 w-[min(56rem,100%-4rem)] flex-col gap-4"
      >
        <div className="rounded-card border border-line bg-paper px-6 py-4 shadow-card">
          <div className="flex items-start gap-2">
            <h1 className="min-w-0 flex-1 font-bold text-2xl text-ink-900 leading-[1.4] tracking-[0.01em]">
              {post.title}
            </h1>
            {editButton}
            {deleteButton}
          </div>
          <AnnouncementMeta post={post} />
        </div>
        <div className="post-body custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <SectionErrorBoundary label="文章內容">
            <MarkdownView markdown={post.content ?? ""} />
          </SectionErrorBoundary>
        </div>
      </article>
    );
  }
  return (
    <article ref={rootRef} className="flex min-h-0 flex-1 flex-col gap-4">
      <div
        data-reader-title
        className="flex items-center gap-2 rounded-card border border-line bg-paper py-4 pr-4 pl-6 shadow-card"
      >
        <h1 className="min-w-0 flex-1 font-bold text-2xl text-ink-900 leading-[1.4] tracking-[0.01em]">
          {post.title}
        </h1>
        <ReaderMode title={post.title} />
        {editButton}
        {deleteButton}
        <button
          type="button"
          data-reader-hide
          className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-control px-2 transition-colors hover:bg-field"
          onClick={onLike}
          aria-label={`${like ? "取消喜歡" : "喜歡"}（${likeCount} 個讚）`}
          aria-pressed={like}
        >
          <svg
            aria-hidden="true"
            width="26"
            height="26"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M26.9399 6.38798C26.2047 5.64761 25.3304 5.05985 24.3673 4.65849C23.4042 4.25714 22.3713 4.05012 21.3279 4.04932C19.3543 4.04964 17.4528 4.79101 15.9999 6.12665C14.5471 4.79079 12.6455 4.04938 10.6719 4.04932C9.62728 4.0504 8.59319 4.25806 7.62914 4.66034C6.66509 5.06262 5.79011 5.65158 5.05456 6.39332C1.91723 9.54398 1.91856 14.472 5.05723 17.6093L15.9999 28.552L26.9426 17.6093C30.0812 14.472 30.0826 9.54398 26.9399 6.38798Z"
              fill={like ? "#EE5757" : "#BDBDBD"}
            />
          </svg>
          <span
            className={`min-w-[1ch] font-semibold text-sm tabular-nums ${
              like ? "text-[#c53d3d]" : "text-ink-700"
            }`}
          >
            {likeCount}
          </span>
        </button>
      </div>
      <ReaderByline post={post} />
      <div className="post-body custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <SectionErrorBoundary label="文章內容">
          <MarkdownView markdown={post.content ?? ""} />
        </SectionErrorBoundary>
      </div>
    </article>
  );
};

export default Thread;

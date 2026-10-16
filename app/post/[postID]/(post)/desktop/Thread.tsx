"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { MarkdownView } from "@/components/Markdown/MarkdownView";
import ReaderMode from "@/components/ReaderMode";
import ReaderByline from "@/components/ReaderMode/Byline";
import useDuplicateTitle from "@/components/ReaderMode/useDuplicateTitle";
import type { TThread } from "@/interfaces/Thread";
import { useUserAccount } from "@/utils/useUserAccount";

const Thread = ({ post }: { post: TThread }) => {
  const { isLogin, isLoading, token, userData } = useUserAccount();

  const [like, setLike] = useState<boolean>(false);
  const rootRef = useRef<HTMLElement>(null);
  useDuplicateTitle(rootRef, post.title);

  const route = useRouter();

  function onLike() {
    if (!isLoading && !isLogin) {
      Swal.fire({
        title: "Please login first",
        text: "You must login to like someone's post",
        icon: "warning",
        confirmButtonText: "Confirm",
      });
    } else {
      setLike(!like);
      if (like) {
        DeleteLike();
      } else {
        PostLike();
      }
    }
  }

  function onEdit() {
    route.push(`/post/${post._id}/edit`);
  }

  function onDelete() {
    Swal.fire({
      title: "Are you sure you want to delete this post",
      icon: "question",
      confirmButtonText: "Confirm",
      showCancelButton: true,
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        DeletePost();
        Swal.fire({
          title: "Successfully delete post",
          icon: "success",
          confirmButtonText: "Back to home",
          confirmButtonColor: "#6e7881",
          showDenyButton: true,
          denyButtonText: "Create new post",
          denyButtonColor: "#82D7FF",
        }).then(async (result) => {
          if (result.isConfirmed) {
            route.push("/");
          } else if (result.isDenied) {
            route.push("/new");
          }
        });
      }
    });
  }

  async function DeletePost() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/post/${post._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });
    } catch (_error) {
      // Silently ignore - delete result does not affect UI
    }
  }

  async function PostLike() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/post/${post._id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });
    } catch (_error) {
      // Silently ignore - like state is optimistically toggled in UI
    }
  }
  async function DeleteLike() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/post/${post._id}/like`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });
    } catch (_error) {
      // Silently ignore - unlike state is optimistically toggled in UI
    }
  }

  useEffect(() => {
    if (isLogin) {
      post.like?.includes(userData?._id ?? "") ? setLike(true) : setLike(false);
    }
  }, [isLogin, post.like, userData?._id]);

  const isOwner = isLogin && post.user === userData?._id;
  const iconButton =
    "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control transition-colors hover:bg-field";

  if (post.sig === "652d60b842cdf6a660c2b778") {
    return (
      <article
        ref={rootRef}
        className="layout-doc mx-auto flex h-full min-h-0 w-[min(56rem,100%-4rem)] flex-col gap-4"
      >
        <div className="rounded-card border border-line bg-paper px-6 py-4 shadow-card">
          <h1 className="font-bold text-2xl text-ink-900 leading-[1.4] tracking-[0.01em]">
            {post.title}
          </h1>
        </div>
        <div className="post-body custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <MarkdownView markdown={post.content} />
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
        {isOwner && (
          <button
            type="button"
            data-reader-hide
            className={iconButton}
            onClick={onEdit}
            aria-label="編輯貼文"
          >
            <Image src="/icons/edit.svg" width={26} height={26} alt="" />
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            data-reader-hide
            className={iconButton}
            onClick={onDelete}
            aria-label="刪除貼文"
          >
            <Image src="/icons/delete.svg" width={26} height={26} alt="" />
          </button>
        )}
        <button
          type="button"
          data-reader-hide
          className={iconButton}
          onClick={onLike}
          aria-label={like ? "取消喜歡" : "喜歡"}
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
        </button>
      </div>
      <ReaderByline post={post} />
      <div className="post-body custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <MarkdownView markdown={post.content} />
      </div>
    </article>
  );
};

export default Thread;

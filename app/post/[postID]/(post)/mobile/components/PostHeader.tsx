"use client";

import { Flag, Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import {
  TapScale,
  TapScaleButton,
  TapScaleLink,
} from "@/components/mobile/TapScale";
import { toast } from "@/components/mobile/Toast";
import { SigChip } from "@/components/Threads/mobile/ThreadsList";
import type { TThread } from "@/interfaces/Thread";
import relativeTime from "@/modules/relativeTime";
import { formatViews } from "@/modules/views";
import useSig from "@/utils/useSig";
import useUser from "@/utils/useUser";
import { useUserAccount } from "@/utils/useUserAccount";
import { confirmDeletePost } from "../../components/confirmDeletePost";
import { usePostPermissions } from "../../components/usePostPermissions";

const DEFAULT_AVATAR = "/images/default-avatar.png";

type Props = {
  post: TThread;
  isAnnouncement?: boolean;
  /** 檢舉 this post (not offered on your own post). */
  onReport?: () => void;
};

// Top of the mobile post page: back, the author, and 「⋯」 with 編輯 /
// 刪除 (author and managers), 複製連結 and 檢舉. 讚 / 留言 / 收藏 / 分享
// are in the bottom bar.

export default function PostHeader({ post, isAnnouncement, onReport }: Props) {
  const router = useRouter();
  const { isLogin, userData, token } = useUserAccount();
  const { canEdit, canDelete } = usePostPermissions(post);
  const [moreOpen, setMoreOpen] = useState(false);
  const authorId =
    typeof post.user === "string"
      ? post.user
      : (post.user as { _id?: string } | null)?._id;
  const isOwnPost = isLogin && Boolean(authorId) && authorId === userData?._id;
  const { data: user } = useUser(post.user);
  const { data: sig, isLoading: sigLoading } = useSig(post.sig);

  // No profile link until the author is known (never "/@anonymous").
  const customId = user?.customId;
  const avatar = user?.avatar || DEFAULT_AVATAR;
  const sigId = post.sig;
  const sigName = isAnnouncement
    ? "公告"
    : (sig?.name ?? (sigLoading ? "…" : "未知的 SIG"));

  const copyLink = async () => {
    setMoreOpen(false);
    try {
      await navigator.clipboard.writeText(window.location.href.split("#")[0]);
      toast.info("已複製連結");
    } catch (_err) {
      toast.error("無法複製連結");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-surface px-3 py-2.5 shadow-card">
      <TapScale
        onClick={() => router.back()}
        className="flex size-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-control bg-field text-ink-700"
        whileTap={{ scale: 0.9 }}
        aria-label="返回"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </TapScale>
      {customId ? (
        <TapScaleLink
          href={`/@${customId}`}
          className="flex-shrink-0"
          whileTap={{ scale: 0.9 }}
        >
          <Image
            src={avatar}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
            }}
          />
        </TapScaleLink>
      ) : (
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-field" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-ink-900 text-sm leading-tight">
          {customId ? (
            <>
              {user?.name || `@${customId}`}
              {user?.name && (
                <span className="ml-1.5 font-normal text-ink-500 text-xs">
                  @{customId}
                </span>
              )}
            </>
          ) : (
            <span className="inline-block h-3.5 w-24 animate-pulse rounded-chip bg-field align-middle" />
          )}
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
          {isAnnouncement ? (
            <span className="rounded-chip bg-warm-600/10 px-1.5 py-0.5 font-semibold text-[11px] text-warm-600">
              {sigName}
            </span>
          ) : (
            <SigChip
              sig={{ _id: sigId, name: sigName }}
              className="!shrink !px-1.5 !text-[11px] min-w-0 truncate"
            />
          )}
          {post.pinned && (
            <span className="shrink-0 rounded-chip bg-brand-50 px-1.5 py-0.5 font-semibold text-[11px] text-brand-800">
              置頂
            </span>
          )}
          <span className="shrink-0 whitespace-nowrap text-ink-500 text-xs">
            {relativeTime(post.createdAt ?? "")}
          </span>
          {typeof post.views === "number" && (
            <span
              className="shrink-0 whitespace-nowrap text-ink-500 text-xs"
              data-views
            >
              · {formatViews(post.views)} 次瀏覽
            </span>
          )}
        </div>
      </div>
      <TapScaleButton
        type="button"
        onClick={() => setMoreOpen(true)}
        className="flex size-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-control bg-field text-ink-700"
        whileTap={{ scale: 0.9 }}
        aria-label="更多動作"
        aria-haspopup="dialog"
      >
        <MoreHorizontal aria-hidden className="size-5" />
      </TapScaleButton>
      <BottomSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="更多動作"
        snapPoints={["auto"]}
      >
        <div className="flex flex-col gap-2 pb-2">
          {canEdit && (
            <button
              type="button"
              className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-control border border-line bg-surface px-3 font-semibold text-ink-800"
              onClick={() => {
                setMoreOpen(false);
                router.push(`/post/${post._id}/edit`);
              }}
            >
              <Pencil aria-hidden className="size-5 text-ink-500" />
              編輯貼文
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-control border border-line bg-surface px-3 font-semibold text-danger-700"
              onClick={() => {
                setMoreOpen(false);
                confirmDeletePost(post._id, token, (href) => router.push(href));
              }}
            >
              <Trash2 aria-hidden className="size-5" />
              刪除貼文
            </button>
          )}
          <button
            type="button"
            className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-control border border-line bg-surface px-3 font-semibold text-ink-800"
            onClick={copyLink}
          >
            <Link2 aria-hidden className="size-5 text-ink-500" />
            複製連結
          </button>
          {onReport && !isOwnPost && (
            <button
              type="button"
              className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-control border border-line bg-surface px-3 font-semibold text-danger-700"
              onClick={() => {
                setMoreOpen(false);
                onReport();
              }}
            >
              <Flag aria-hidden className="size-5" />
              檢舉這篇貼文
            </button>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

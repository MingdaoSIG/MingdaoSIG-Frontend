"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { TapScale, TapScaleLink } from "@/components/mobile/TapScale";
import { toast } from "@/components/mobile/Toast";
import { SigChip } from "@/components/Threads/mobile/ThreadsList";
import type { TThread } from "@/interfaces/Thread";
import relativeTime from "@/modules/relativeTime";
import useSig from "@/utils/useSig";
import useUser from "@/utils/useUser";

const DEFAULT_AVATAR = "/images/default-avatar.png";

type Props = {
  post: TThread;
  isAnnouncement?: boolean;
};

export default function PostHeader({ post, isAnnouncement }: Props) {
  const router = useRouter();
  const { data: user } = useUser(post.user);
  const { data: sig } = useSig(post.sig);

  const customId = user?.customId ?? "anonymous";
  const avatar = user?.avatar || DEFAULT_AVATAR;
  const sigId = post.sig;
  const sigName = isAnnouncement ? "公告" : (sig?.name ?? "SIG");

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ url, title: post.title });
        return;
      } catch (_err) {
        // user cancelled or share failed; fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.info("已複製連結");
    } catch (_err) {
      toast.error("無法複製連結");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-surface px-3 py-2.5 shadow-card">
      <TapScale
        onClick={() => router.back()}
        className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-control bg-field text-ink-700"
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
      <TapScaleLink
        href={`/@${customId}`}
        className="flex-shrink-0"
        whileTap={{ scale: 0.9 }}
      >
        <Image
          src={avatar}
          alt={`${customId} avatar`}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
          unoptimized
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
          }}
        />
      </TapScaleLink>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-ink-900 text-sm leading-tight">
          @{customId}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          {isAnnouncement ? (
            <span className="rounded-chip bg-warm-600/10 px-1.5 py-0.5 font-semibold text-[11px] text-warm-600">
              {sigName}
            </span>
          ) : (
            <SigChip
              sig={{ _id: sigId, name: sigName }}
              className="!px-1.5 !text-[11px]"
            />
          )}
          <span className="text-ink-500 text-xs">
            {relativeTime(post.createdAt ?? "")}
          </span>
        </div>
      </div>
      <TapScale
        onClick={handleShare}
        className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-control bg-field text-ink-700"
        whileTap={{ scale: 0.9 }}
        aria-label="分享貼文"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </TapScale>
    </div>
  );
}

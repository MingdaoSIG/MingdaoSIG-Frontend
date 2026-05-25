"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { TapScale, TapScaleLink } from "@/components/mobile/TapScale";
import { toast } from "@/components/mobile/Toast";
import { sigDefaultColors } from "@/components/Threads/configs/sigDefaultColors";
import type { TThread } from "@/interfaces/Thread";
import relativeTime from "@/modules/relativeTime";
import useSig from "@/utils/useSig";
import useUser from "@/utils/useUser";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_AVATAR = `${API_URL}/image/653299930b891d1f6b5b4458`;

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
  const sigColor = isAnnouncement
    ? "#003F47"
    : sigDefaultColors[sigId] || "#009BB0";

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
    <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2.5 backdrop-blur-md">
      <TapScale
        onClick={() => router.back()}
        className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-black/5 text-gray-600 text-lg"
        whileTap={{ scale: 0.9 }}
        aria-label="返回"
      >
        ‹
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
        />
      </TapScaleLink>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-[13px] text-md-dark-green leading-tight">
          @{customId}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className="rounded-full px-2 py-0.5 font-semibold text-[10px] text-white"
            style={{ backgroundColor: sigColor }}
          >
            {sigName}
          </span>
          <span className="text-[10px] text-gray-500">
            {relativeTime(post.createdAt ?? "")}
          </span>
        </div>
      </div>
      <TapScale
        onClick={handleShare}
        className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-black/5 text-gray-600"
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

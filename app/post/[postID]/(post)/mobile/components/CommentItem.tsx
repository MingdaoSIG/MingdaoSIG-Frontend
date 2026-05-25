"use client";

import Image from "next/image";
import Linkify from "react-linkify";

import { TapScale, TapScaleLink } from "@/components/mobile/TapScale";
import type { TComments } from "@/interfaces/comments";
import relativeTime from "@/modules/relativeTime";
import { jumpOut } from "@/utils/jumpOut";

type Props = {
  comment: TComments;
  variant?: "top" | "reply";
  onReply?: (comment: TComments) => void;
};

export default function CommentItem({
  comment,
  variant = "top",
  onReply,
}: Props) {
  const isReply = variant === "reply";
  const avatarSize = isReply ? 28 : 36;
  const containerClass = isReply
    ? "ml-6 flex gap-2 rounded-xl bg-white/55 p-2.5 backdrop-blur-md"
    : "flex gap-2.5 rounded-2xl bg-white/70 p-3 backdrop-blur-md";
  const nameClass = isReply
    ? "font-semibold text-[12px] text-md-dark-green"
    : "font-semibold text-[13px] text-md-dark-green";
  const timeClass = isReply
    ? "text-[10px] text-gray-500"
    : "text-[11px] text-gray-500";
  const contentClass = isReply
    ? "text-[12px] text-[#354242] leading-relaxed"
    : "text-[13px] text-[#354242] leading-relaxed";

  return (
    <div className={containerClass}>
      <TapScaleLink
        href={`/@${comment.user.customId}`}
        className="flex-shrink-0"
        whileTap={{ scale: 0.9 }}
      >
        <Image
          src={comment.user.avatar}
          alt={`${comment.user.customId} avatar`}
          width={avatarSize}
          height={avatarSize}
          className="rounded-full object-cover"
          style={{ width: avatarSize, height: avatarSize }}
          unoptimized
        />
      </TapScaleLink>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <TapScaleLink
            href={`/@${comment.user.customId}`}
            className={nameClass}
            whileTap={{ scale: 0.96 }}
          >
            @{comment.user.customId}
          </TapScaleLink>
          <span className={timeClass}>
            {relativeTime(comment.createdAt ?? "")}
          </span>
        </div>
        <p className={`mt-0.5 break-words ${contentClass}`}>
          <Linkify
            componentDecorator={(decoratedHref, decoratedText, key) => (
              <button
                type="button"
                key={key}
                className="break-words text-[#0070f3] underline-offset-2 hover:underline"
                onClick={() => jumpOut(decoratedHref)}
              >
                {decoratedText}
              </button>
            )}
          >
            {comment.content}
          </Linkify>
        </p>
        {!isReply && onReply && (
          <div className="mt-1.5 flex gap-3">
            <TapScale
              onClick={() => onReply(comment)}
              className="cursor-pointer font-semibold text-[11px] text-md-dark-green"
              whileTap={{ scale: 0.92 }}
              aria-label={`回覆 @${comment.user.customId}`}
            >
              ↩ 回覆
            </TapScale>
          </div>
        )}
      </div>
    </div>
  );
}

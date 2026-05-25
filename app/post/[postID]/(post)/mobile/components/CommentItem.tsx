"use client";

import Image from "next/image";
import Linkify from "react-linkify";

import { TapScaleLink } from "@/components/mobile/TapScale";
import type { TComments } from "@/interfaces/comments";
import relativeTime from "@/modules/relativeTime";
import { jumpOut } from "@/utils/jumpOut";

const DEFAULT_AVATAR = "/images/default-avatar.png";

type Props = {
  comment: TComments;
};

export default function CommentItem({ comment }: Props) {
  return (
    <div className="flex gap-2.5 rounded-2xl bg-white/70 p-3 backdrop-blur-md">
      <TapScaleLink
        href={`/@${comment.user.customId}`}
        className="flex-shrink-0"
        whileTap={{ scale: 0.9 }}
      >
        <Image
          src={comment.user.avatar || DEFAULT_AVATAR}
          alt={`${comment.user.customId} avatar`}
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-cover"
          unoptimized
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
          }}
        />
      </TapScaleLink>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <TapScaleLink
            href={`/@${comment.user.customId}`}
            className="font-semibold text-[13px] text-md-dark-green"
            whileTap={{ scale: 0.96 }}
          >
            @{comment.user.customId}
          </TapScaleLink>
          <span className="text-[11px] text-gray-500">
            {relativeTime(comment.createdAt ?? "")}
          </span>
        </div>
        <p className="mt-0.5 break-words text-[#354242] text-[13px] leading-relaxed">
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
      </div>
    </div>
  );
}

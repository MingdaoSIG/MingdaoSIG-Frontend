"use client";

import Image from "next/image";
import Linkify from "@/components/Linkify/Linkify";

import { TapScaleLink } from "@/components/mobile/TapScale";
import type { TComments } from "@/interfaces/comments";
import relativeTime from "@/modules/relativeTime";
import { jumpOut } from "@/utils/jumpOut";

const DEFAULT_AVATAR = "/images/default-avatar.png";

type Props = {
  comment: TComments;
};

export default function CommentItem({ comment }: Props) {
  // A deleted author comes back without a user: show no profile link.
  const customId = comment.user?.customId;
  const avatar = (
    <Image
      src={comment.user?.avatar || DEFAULT_AVATAR}
      alt={customId ? `${customId} avatar` : ""}
      width={36}
      height={36}
      className="h-9 w-9 rounded-full object-cover"
      unoptimized
      onError={(e) => {
        (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
      }}
    />
  );

  return (
    <div className="flex gap-2.5 rounded-card border border-line bg-surface p-3">
      {customId ? (
        <TapScaleLink
          href={`/@${customId}`}
          className="flex-shrink-0"
          whileTap={{ scale: 0.9 }}
        >
          {avatar}
        </TapScaleLink>
      ) : (
        <div className="flex-shrink-0">{avatar}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          {customId ? (
            <TapScaleLink
              href={`/@${customId}`}
              className="font-semibold text-ink-900 text-sm"
              whileTap={{ scale: 0.96 }}
            >
              @{customId}
            </TapScaleLink>
          ) : (
            <span className="font-semibold text-ink-500 text-sm">
              已刪除的使用者
            </span>
          )}
          <span className="text-ink-500 text-xs">
            {relativeTime(comment.createdAt ?? "")}
          </span>
        </div>
        <p className="mt-0.5 break-words text-[0.9375rem] text-ink-700 leading-[1.65]">
          <Linkify
            componentDecorator={(decoratedHref, decoratedText, key) => (
              <button
                type="button"
                key={key}
                className="break-all text-left text-brand-700 underline decoration-brand-700/30 underline-offset-2"
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

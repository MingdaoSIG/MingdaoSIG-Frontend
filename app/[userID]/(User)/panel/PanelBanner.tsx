"use client";

import { Pencil } from "lucide-react";
import Image from "next/image";
import { ProfileBadges } from "@/components/Badges/ProfileBadges";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";

// The platform's banner header (owner: 「那是我們平台的精髓」), the same on
// SIG pages and profiles: the 16:9 artwork, the round avatar with a white
// border over its bottom-left edge, badges at its bottom right and, for a
// SIG's managers, 編輯 SIG at its top right. Its height is its own aspect
// ratio, never the column's. `strip` is the short version (phones, once
// the card has collapsed).

export function PanelBanner({
  avatar,
  badges,
  onEditSig,
  strip = false,
  accent,
}: {
  avatar: string | undefined;
  badges?: string[];
  /** Managers of the SIG: 「編輯 SIG」. */
  onEditSig?: () => void;
  strip?: boolean;
  /** The SIG colour, as a line along the banner's bottom. */
  accent?: string;
}) {
  const size = strip ? 44 : 96;
  return (
    <div
      className={`relative flex-none bg-center bg-cover ${
        strip ? "h-12" : "aspect-video"
      }`}
      style={{ backgroundImage: "url(/images/banner.svg)" }}
      data-panel-banner
    >
      {accent && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1"
          style={{ background: accent }}
        />
      )}
      <Image
        src={imageUrl(avatar) ?? DEFAULT_AVATAR_URL}
        width={size}
        height={size}
        alt=""
        unoptimized
        className={`absolute shrink-0 rounded-full border-[0.3rem] border-white bg-white object-cover ${
          strip ? "-bottom-5 left-3" : "-bottom-12 left-4"
        }`}
        style={{ width: size, height: size }}
      />
      {!strip && (
        <ProfileBadges
          keys={badges}
          className="absolute right-3 bottom-3 flex gap-1 rounded-chip bg-white/85 p-1"
          badgeClassName="size-5 cursor-pointer"
        />
      )}
      {onEditSig && !strip && (
        <button
          type="button"
          className="absolute top-3 right-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-control border border-line bg-surface/95 px-3 font-semibold text-ink-800 text-sm shadow-card transition-colors hover:bg-field"
          onClick={onEditSig}
        >
          <Pencil size={15} aria-hidden />
          編輯 SIG
        </button>
      )}
    </div>
  );
}

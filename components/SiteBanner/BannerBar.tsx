"use client";

import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Info,
  type LucideIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BANNER_STYLE,
  type BannerLevel,
  bannerLink,
} from "@/modules/siteBanner";

// One slim notice band: a status-tinted background, an icon, the message,
// an optional link and an optional close button. Used for the site banner,
// the suspension notice and the admin preview.

export const LEVEL_ICON: Record<BannerLevel, LucideIcon> = {
  info: Info,
  warning: CircleAlert,
  success: CircleCheck,
};

export type BandTone = BannerLevel | "danger";

const DANGER = {
  band: "border-danger-700/20 bg-danger-50",
  icon: "text-danger-700",
  link: "text-danger-700",
};

export function BannerBar({
  tone,
  icon,
  children,
  link,
  linkLabel = "查看",
  onDismiss,
  dismissLabel = "關閉公告",
  layout = "page",
  role = "status",
}: {
  tone: BandTone;
  icon?: LucideIcon;
  children: ReactNode;
  link?: string | null;
  linkLabel?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
  /** "page": full width, content in the page column; "inline": a box. */
  layout?: "page" | "inline";
  role?: "status" | "alert";
}) {
  const style = tone === "danger" ? DANGER : BANNER_STYLE[tone];
  const Icon = icon ?? (tone === "danger" ? CircleAlert : LEVEL_ICON[tone]);
  const target = bannerLink(link);

  const linkNode = target ? (
    target.external ? (
      <a
        href={target.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap font-semibold underline decoration-current/30 underline-offset-[0.2em] hover:decoration-current ${style.link}`}
      >
        {linkLabel}
        <ArrowRight aria-hidden className="size-3.5" />
        <span className="sr-only">（在新分頁開啟）</span>
      </a>
    ) : (
      <Link
        href={target.href}
        className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap font-semibold underline decoration-current/30 underline-offset-[0.2em] hover:decoration-current ${style.link}`}
      >
        {linkLabel}
        <ArrowRight aria-hidden className="size-3.5" />
      </Link>
    )
  ) : null;

  const body = (
    <div
      className={`flex items-start gap-2.5 text-[0.875rem] text-ink-800 leading-6 ${
        layout === "page"
          ? "mx-auto w-[min(80rem,100%-2rem)] py-2 lg:w-[min(80rem,100%-4rem)]"
          : "px-3 py-2"
      }`}
    >
      <Icon aria-hidden className={`mt-1 size-4 shrink-0 ${style.icon}`} />
      <p className="min-w-0 flex-1 break-words">
        {children}
        {linkNode && <> {linkNode}</>}
      </p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-my-1 -mr-1.5 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-800"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );

  return (
    <div
      role={role}
      className={
        layout === "page"
          ? `w-full border-b ${style.band}`
          : `rounded-control border ${style.band}`
      }
    >
      {body}
    </div>
  );
}

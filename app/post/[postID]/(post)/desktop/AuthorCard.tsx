"use client";

import Image from "next/image";
import Link from "next/link";
import type { TThread } from "@/interfaces/Thread";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";
import { BRAND_COLOR } from "@/modules/sigTheme";
import { useSigColor } from "@/modules/sigTheme/useSigColor";
import useSig from "@/utils/useSig";
import useUser from "@/utils/useUser";

// The author card at the top of the post page's side rail (decision 6C):
// who wrote it, in which SIG, and the way to their profile. Links wait for
// the ids, so they never point at /@undefined.

export function AuthorCard({ post }: { post: TThread }) {
  const { data: user, isLoading: userLoading } = useUser(post.user);
  const { data: sig, isLoading: sigLoading } = useSig(post.sig);
  const colorOf = useSigColor();
  const name =
    user?.name ||
    (user?.customId ? `@${user.customId}` : null) ||
    (userLoading ? "載入中…" : "未知的使用者");
  const sigName = sig?.name || (sigLoading ? "載入中…" : "未知的 SIG");
  const sigColor = colorOf(sig ?? post.sig, BRAND_COLOR);

  return (
    <section
      aria-label="作者"
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
      data-author-card
    >
      <div className="flex min-w-0 items-center gap-3">
        <Image
          src={imageUrl(user?.avatar) ?? DEFAULT_AVATAR_URL}
          width={48}
          height={48}
          alt=""
          unoptimized
          className="size-12 shrink-0 rounded-full border border-line bg-field object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words font-bold text-ink-900 leading-snug">
            {name}
          </p>
          {user?.name && user.customId && (
            <p className="truncate text-[13px] text-ink-500">
              @{user.customId}
            </p>
          )}
        </div>
      </div>
      {user?.description && (
        <p className="line-clamp-3 whitespace-pre-line break-words text-[13px] text-ink-700 leading-5">
          {user.description}
        </p>
      )}
      {sig?.customId ? (
        <Link
          href={`/@${sig.customId}`}
          className="sig-text flex min-w-0 items-center gap-2 self-start rounded-chip px-1 font-semibold text-sm hover:underline"
          style={{ ["--sig-color" as string]: sigColor }}
        >
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: sigColor }}
          />
          <span className="min-w-0 break-words">{sigName}</span>
        </Link>
      ) : (
        <p className="flex items-center gap-2 px-1 text-ink-500 text-sm">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full bg-ink-400/40"
          />
          {sigName}
        </p>
      )}
      {user?.customId && (
        <Link
          href={`/@${user.customId}`}
          className="flex h-9 items-center justify-center rounded-control border border-line-strong bg-surface font-semibold text-ink-800 text-sm transition-colors hover:bg-field"
        >
          查看個人頁
        </Link>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import type { Sig } from "@/interfaces/Sig";
import { isRecruitingNow, recruitingOf } from "@/modules/sigRecruiting";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import { ANNOUNCEMENT_SIG_ID, useSigDirectory } from "@/utils/useAdminAccess";

// 「正在招生」: SIGs that take join requests now (open, not past `until`),
// from `/sig/list` (contract v4 §6.5). 探索 shows them as cards, the home
// side column as a short list.

/** The SIGs recruiting now, the ones closing soonest first. */
export function useRecruitingSigs() {
  const directory = useSigDirectory();
  const sigs = (directory.data ?? []).filter(
    (sig) =>
      sig._id !== ANNOUNCEMENT_SIG_ID &&
      sig.customId &&
      sig.recruiting &&
      isRecruitingNow(sig),
  );
  const until = (sig: Sig) =>
    recruitingOf(sig).until?.getTime() ?? Number.POSITIVE_INFINITY;
  return {
    sigs: [...sigs].sort((a, b) => until(a) - until(b)),
    isPending: directory.isPending,
    isError: directory.isError,
  };
}

/** 「11/22 截止」, 「11/22 截止，剩 2 天」 or 「招生中」 (no end). */
export function deadlineText(sig: Sig, now: number = Date.now()) {
  const { until } = recruitingOf(sig);
  if (!until) {
    return "招生中";
  }
  const days = Math.ceil((until.getTime() - now) / 86400000);
  const date = `${until.getMonth() + 1}/${until.getDate()}`;
  return days <= 3
    ? `${date} 截止，剩 ${Math.max(days, 0)} 天`
    : `${date} 截止`;
}

/** One recruiting SIG as a card with a colour top border. */
export function RecruitingSigCard({ sig }: { sig: Sig }) {
  const { message } = recruitingOf(sig);
  return (
    <Link
      href={`/@${sig.customId}`}
      title={sig.name}
      data-recruiting-sig={sig._id}
      className="flex h-full min-w-0 flex-col gap-1.5 rounded-control border border-line border-t-[4px] border-t-[var(--sig-color)] bg-surface p-3 transition-colors hover:bg-[color-mix(in_srgb,var(--sig-color)_6%,white)]"
      style={{ ["--sig-color" as string]: resolveSigColor(sig) ?? BRAND_COLOR }}
    >
      <span className="sig-text line-clamp-2 font-bold text-[0.95rem] leading-snug [overflow-wrap:anywhere]">
        {sig.name}
      </span>
      {message && (
        <span className="line-clamp-2 text-ink-700 text-xs leading-5">
          {message}
        </span>
      )}
      <span className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1">
        <span className="font-semibold text-warm-600 text-xs">
          {deadlineText(sig)}
        </span>
        <span className="font-semibold text-brand-700 text-xs">申請加入 →</span>
      </span>
    </Link>
  );
}

/** A recruiting SIG as one row (the home side column). */
export function RecruitingSigRow({ sig }: { sig: Sig }) {
  return (
    <Link
      href={`/@${sig.customId}`}
      title={sig.name}
      data-recruiting-sig={sig._id}
      className="flex min-w-0 items-center gap-2.5 rounded-control p-1.5 transition-colors hover:bg-field"
      style={{ ["--sig-color" as string]: resolveSigColor(sig) ?? BRAND_COLOR }}
    >
      <span
        aria-hidden
        className="h-9 w-1 shrink-0 rounded-full bg-[var(--sig-color)]"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="sig-text truncate font-semibold text-[0.9rem]">
          {sig.name}
        </span>
        <span className="truncate text-warm-600 text-xs">
          {deadlineText(sig)}
        </span>
      </span>
    </Link>
  );
}

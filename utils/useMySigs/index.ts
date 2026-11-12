"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { Sig } from "@/interfaces/Sig";
import { markSigSeen } from "@/modules/sigSeen";
import { ANNOUNCEMENT_SIG_ID, useSigDirectory } from "@/utils/useAdminAccess";
import { useUserAccount } from "@/utils/useUserAccount";

// The signed-in user's SIGs for the side rail, the 我的 hub and the home
// filter chips: SIGs they lead or advise, are a member of, or follow
// (contract v4 §6.1: `followedSigs` on `GET /user/me`), from the shared
// `/sig/list` cache. Archived SIGs are not in that list and are left out.

export type MySigRole = "managed" | "member" | "followed";
export type MySig = Sig & { role: MySigRole };

const ORDER: Record<MySigRole, number> = { managed: 0, member: 1, followed: 2 };

export function mySigsOf(
  sigs: Sig[],
  user: {
    _id?: string;
    sig?: string[];
    followedSigs?: string[];
  } | null,
): MySig[] {
  if (!user?._id) {
    return [];
  }
  const userId = user._id;
  const member = new Set(user.sig ?? []);
  const followed = new Set(user.followedSigs ?? []);
  const result: MySig[] = [];
  for (const sig of sigs) {
    if (sig._id === ANNOUNCEMENT_SIG_ID || sig.removed) {
      continue;
    }
    const manages =
      sig.leader?.includes(userId) || sig.moderator?.includes(userId);
    const role: MySigRole | null = manages
      ? "managed"
      : member.has(sig._id)
        ? "member"
        : followed.has(sig._id)
          ? "followed"
          : null;
    if (role) {
      result.push({ ...sig, role });
    }
  }
  // Stable within a group: the directory order.
  return result
    .map((sig, index) => ({ sig, index }))
    .sort((a, b) => ORDER[a.sig.role] - ORDER[b.sig.role] || a.index - b.index)
    .map(({ sig }) => sig);
}

/** The user's SIGs; empty when logged out. */
export function useMySigs() {
  const { isLogin, isLoading, userData } = useUserAccount();
  const directory = useSigDirectory();
  const sigs = useMemo(
    () => (isLogin ? mySigsOf(directory.data ?? [], userData) : []),
    [isLogin, directory.data, userData],
  );
  return {
    sigs,
    /** The login or the SIG list is still loading. */
    isLoading: isLoading || (isLogin && directory.isPending),
    isError: directory.isError,
    directory,
  };
}

/**
 * Records a visit when the current page is one of the SIG pages (`/@id`,
 * old ids included), for the side rail's new-post dots.
 */
export function useTrackSigVisits() {
  const pathname = usePathname();
  const { isLogin, userData } = useUserAccount();
  const directory = useSigDirectory(isLogin);
  const userId = userData?._id ?? "";

  useEffect(() => {
    if (!isLogin || !userId || !pathname?.startsWith("/")) {
      return;
    }
    let decoded = pathname;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      // keep the raw path
    }
    if (!decoded.startsWith("/@")) {
      return;
    }
    const id = decoded.slice(2);
    const sig = directory.data?.find(
      (item) => item.customId === id || item.previousCustomIds?.includes(id),
    );
    if (sig) {
      markSigSeen(userId, sig._id);
    }
  }, [pathname, directory.data, isLogin, userId]);
}

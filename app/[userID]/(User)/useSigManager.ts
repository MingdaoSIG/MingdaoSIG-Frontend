"use client";

import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import { useUserAccount } from "@/utils/useUserAccount";

const ADMIN_PERMISSION = 2;

/**
 * May the signed-in user edit this SIG (contract v3 §3.5)? Admins, and
 * the SIG's managers: its leaders and moderators (指導老師).
 */
export function useSigManager(account: User | Sig | null, isSig: boolean) {
  const { isLogin, userData } = useUserAccount();
  const userId = isLogin ? userData?._id : undefined;
  if (!isSig || !account || !userId) {
    return { canManage: false, isLeader: false, isModerator: false };
  }
  const sig = account as Sig;
  const isLeader = Boolean(sig.leader?.includes(userId));
  const isModerator = Boolean(sig.moderator?.includes(userId));
  const isAdmin = userData?.permission === ADMIN_PERMISSION;
  return {
    canManage: isAdmin || isLeader || isModerator,
    isLeader,
    isModerator,
  };
}

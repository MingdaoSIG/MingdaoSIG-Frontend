"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import type { Sig } from "@/interfaces/Sig";
import { apiRequest } from "@/modules/api/client";
import { markSigSeen } from "@/modules/sigSeen";
import { storageGetJSON, storageSet } from "@/utils/safeStorage";
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

// ---- The user's own order (drag to reorder in the side rail) ----------

const ORDER_KEY = (userId: string) => `mdsig:sigOrder:${userId}`;
const SAVE_DELAY = 500;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function isIdList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

/**
 * The saved order: the server's `sigOrder` when it has one, else the copy
 * kept on this device (written on every save, so an order survives a
 * reload even before the backend stores it).
 */
export function savedSigOrder(
  user: { _id?: string; sigOrder?: unknown } | null,
): string[] {
  if (isIdList(user?.sigOrder) && user.sigOrder.length > 0) {
    return user.sigOrder;
  }
  if (!user?._id) {
    return [];
  }
  const local = storageGetJSON<unknown>(ORDER_KEY(user._id));
  return isIdList(local) ? local : [];
}

/** `sigs` in the saved order; SIGs not in it keep their place, at the end. */
export function orderSigs<T extends { _id: string }>(
  sigs: T[],
  order: string[],
): T[] {
  const position = new Map(order.map((id, index) => [id, index]));
  const ordered = sigs.filter((sig) => position.has(sig._id));
  ordered.sort(
    (a, b) => (position.get(a._id) ?? 0) - (position.get(b._id) ?? 0),
  );
  return [...ordered, ...sigs.filter((sig) => !position.has(sig._id))];
}

/**
 * Saves a new order: at once in the profile and on this device, and to the
 * server 500 ms after the last change (`POST /user { sigOrder }`).
 */
export function useSaveSigOrder() {
  const { userData, updateUser } = useUserAccount();
  const userId = userData?._id ?? "";
  return useCallback(
    (ids: string[]) => {
      if (!userId) {
        return;
      }
      const order = [...new Set(ids)].slice(0, 100);
      updateUser({ sigOrder: order });
      storageSet(ORDER_KEY(userId), JSON.stringify(order));
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      saveTimer = setTimeout(() => {
        saveTimer = null;
        void apiRequest("/user", {
          method: "POST",
          body: { sigOrder: order },
          auth: true,
        }).then((result) => {
          if (!result.ok) {
            // The order stays on this device; the next change retries.
            console.warn("sigOrder was not saved:", result.message);
          }
        });
      }, SAVE_DELAY);
    },
    [userId, updateUser],
  );
}

/** The user's SIGs, in their own order; empty when logged out. */
export function useMySigs() {
  const { isLogin, isLoading, userData } = useUserAccount();
  const directory = useSigDirectory();
  const sigs = useMemo(
    () =>
      isLogin
        ? orderSigs(
            mySigsOf(directory.data ?? [], userData),
            savedSigOrder(userData),
          )
        : [],
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

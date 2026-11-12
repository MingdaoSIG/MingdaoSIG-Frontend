"use client";

import { useEffect, useMemo, useState } from "react";
import type { Sig } from "@/interfaces/Sig";
import { apiRequest } from "@/modules/api/client";
import { useUserAccount } from "@/utils/useUserAccount";
import { announcementSigId } from "../config/announcement";

export type SigOption = {
  id: string;
  name: string;
  /** False: listed for reference, but the backend would refuse (4001). */
  allowed: boolean;
};

const ADMIN_PERMISSION = 2;

function isSig(value: unknown): value is Sig {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Sig)._id === "string" &&
    typeof (value as Sig).name === "string"
  );
}

/**
 * SIGs for the editor's dropdown. Mirrors the backend rule
 * (MingdaoSIG-Backend `_module/Permission` canPostToSig):
 * admins may post anywhere; 公告 only accepts its moderators; any other SIG
 * accepts its members, its leaders, and moderators (advisors) of any SIG.
 *
 * SIGs the user can post in come first; the rest are listed disabled.
 * Logged out, every SIG is listed (publishing asks them to log in).
 * `keepSigId`: the SIG an edited post is already in, always allowed.
 */
export function useSigOptions(keepSigId?: string): SigOption[] {
  const { userData, isLogin } = useUserAccount();
  const [sigs, setSigs] = useState<Sig[]>([]);
  const [announcement, setAnnouncement] = useState<Sig | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const [list, announcementSig] = await Promise.all([
        apiRequest<unknown[]>("/sig/list", { signal: controller.signal }),
        apiRequest<unknown>(`/sig/${announcementSigId}`, {
          signal: controller.signal,
        }),
      ]);
      if (controller.signal.aborted) {
        return;
      }
      if (list.ok && Array.isArray(list.data)) {
        setSigs(list.data.filter(isSig));
      } else if (!list.ok) {
        console.error("SIG list failed:", list.message);
      }
      if (announcementSig.ok && isSig(announcementSig.data)) {
        setAnnouncement(announcementSig.data);
      }
    })();
    return () => controller.abort();
  }, []);

  return useMemo(() => {
    const listed = sigs.filter((sig) => sig._id !== announcementSigId);
    const userId = userData?._id;
    if (!isLogin || !userId) {
      return listed.map((sig) => ({
        id: sig._id,
        name: sig.name,
        allowed: true,
      }));
    }

    const isAdmin = userData.permission === ADMIN_PERMISSION;
    const everySig = announcement ? [...sigs, announcement] : sigs;
    const isAnyModerator = everySig.some((sig) =>
      sig.moderator?.includes(userId),
    );
    const canPost = (sig: Sig) =>
      isAdmin ||
      sig._id === keepSigId ||
      Boolean(userData.sig?.includes(sig._id)) ||
      Boolean(sig.leader?.includes(userId)) ||
      isAnyModerator;

    const options: SigOption[] = listed.map((sig) => ({
      id: sig._id,
      name: sig.name,
      allowed: canPost(sig),
    }));
    const canAnnounce =
      isAdmin ||
      keepSigId === announcementSigId ||
      Boolean(announcement?.moderator?.includes(userId));
    if (canAnnounce) {
      options.unshift({ id: announcementSigId, name: "公告", allowed: true });
    }
    // Postable first; Array.prototype.sort is stable, so the API order stays.
    return options.sort((a, b) => Number(b.allowed) - Number(a.allowed));
  }, [sigs, announcement, userData, isLogin, keepSigId]);
}

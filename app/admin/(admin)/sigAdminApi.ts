"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Sig } from "@/interfaces/Sig";
import type { ApiFailure } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { forgetSigDirectory } from "@/modules/sigTheme";
import { SIG_LIST_QUERY_KEY } from "@/utils/useAdminAccess";
import {
  adminKeys,
  failureMessage,
  getData,
  getPage,
  useInvalidate,
} from "./api";
import type { AdminSig, RolloverPreview } from "./types";

// Reads and helpers for SIG administration (contract v4 §3.7, §5.6–§5.9):
// archived SIGs, a SIG's join form settings and the year rollover
// preview. Writes go through `send` in ./api.

export const sigAdminKeys = {
  archived: ["admin", "sigs", "archived"] as const,
  sigSettings: (id: string) => ["admin", "sigs", "settings", id] as const,
  rollover: ["admin", "rollover"] as const,
  badges: ["admin", "badges"] as const,
};

/** SIG customIds: like user ids, but up to 50 characters. */
export const SIG_CUSTOM_ID_MAX = 50;
export const USER_CUSTOM_ID_MAX = 25;
const CUSTOM_ID_PATTERN = /^[a-z0-9_]+(\.[a-z0-9_]+)*$/;

/** Why a customId cannot be used, or "" when its format is fine. */
export function customIdProblem(value: string, max: number) {
  if (value === "") {
    return "請輸入 ID";
  }
  if (value.length > max) {
    return `最多 ${max} 個字元`;
  }
  if (!CUSTOM_ID_PATTERN.test(value)) {
    return "只能用小寫英文、數字和底線（_），可以用一個點（.）分段";
  }
  return "";
}

/** A refused customId (4021 / 4022), or the usual message. */
export function customIdFailure(failure: ApiFailure, max: number) {
  if (failure.status === CustomStatus.CUSTOM_ID_ALREADY_EXISTS) {
    return "這個 ID 已經有人使用（其他使用者或 SIG，或仍會轉址的舊 ID），請換一個";
  }
  if (failure.status === CustomStatus.INVALID_CUSTOM_ID) {
    return `ID 格式不正確：小寫英文、數字和底線，可用點分段，最多 ${max} 個字元`;
  }
  return "";
}

/** Archived SIGs (admins only, `GET /admin/sigs?archived=1`). */
export function useArchivedSigs(enabled: boolean) {
  return useQuery({
    queryKey: sigAdminKeys.archived,
    queryFn: async ({ signal }) => {
      const page = await getPage<AdminSig>(
        "/admin/sigs",
        { archived: 1 },
        signal,
      );
      return page.items.map((sig) => ({
        ...sig,
        archived: sig.archived ?? true,
        leaders: Array.isArray(sig.leaders) ? sig.leaders : [],
        moderators: Array.isArray(sig.moderators) ? sig.moderators : [],
      }));
    },
    enabled,
  });
}

/** The SIG as the site reads it, for its join questions and recruiting. */
export function useSigSettings(sigId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: sigAdminKeys.sigSettings(sigId),
    queryFn: ({ signal }) => getData<Sig>(`/sig/${sigId}`, undefined, signal),
    enabled: enabled && Boolean(sigId),
  });
}

export function useRolloverPreview(enabled: boolean = true) {
  return useQuery({
    queryKey: sigAdminKeys.rollover,
    queryFn: ({ signal }) =>
      getData<RolloverPreview>("/admin/rollover/preview", undefined, signal),
    enabled,
  });
}

/**
 * After a SIG changed: every list that shows SIGs (admin lists, the shared
 * `/sig/list` cache for colours, the SIG's own reads, the editors' cache).
 */
export function useRefreshSigs() {
  const invalidate = useInvalidate();
  return useCallback(
    (sigId?: string) => {
      forgetSigDirectory();
      return invalidate(
        adminKeys.sigs,
        adminKeys.overview,
        SIG_LIST_QUERY_KEY,
        ...(sigId ? [["sig", sigId]] : []),
      );
    },
    [invalidate],
  );
}

/** `failureMessage` with the SIG-specific refusals of POST /sig/:id. */
export function sigWriteFailure(failure: ApiFailure) {
  if (failure.status === CustomStatus.INVALID_IMAGE_ID) {
    return "圖片無效，請重新上傳";
  }
  if (failure.status === CustomStatus.INVALID_CONTENT_LENGTH) {
    return "有欄位超過字數上限";
  }
  return (
    customIdFailure(failure, SIG_CUSTOM_ID_MAX) ||
    failureMessage(failure, "只有管理員可以修改這些設定")
  );
}

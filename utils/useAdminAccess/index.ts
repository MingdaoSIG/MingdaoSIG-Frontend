"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import type { Sig } from "@/interfaces/Sig";
import { ApiError, apiRequest, describeFailure } from "@/modules/api/client";
import { useUserAccount } from "@/utils/useUserAccount";

// Who may open the admin panel (/admin), and what they may see there.
//
// - admin: `permission === 2`, every module.
// - content moderator (內容管理員): `permission === 3` (contract v4
//   §5.2): posts, comments, reports, and users (read and mute only).
// - SIG manager: a leader or moderator (指導老師) of at least one SIG,
//   scoped to those SIGs. A content moderator may be one as well.
// - anyone else: the 404 page.
//
// Managers are found from the public `GET /sig/list` (each SIG's leader[]
// and moderator[] id arrays). Admins need no lookup at all.

export const ADMIN_PERMISSION = 2;
export const CONTENT_MODERATOR_PERMISSION = 3;

/** The announcement SIG. Stored as removed, so it is not in /sig/list. */
export const ANNOUNCEMENT_SIG_ID = "652d60b842cdf6a660c2b778";

export const SIG_LIST_QUERY_KEY = ["sig-list"] as const;

/** Every non-removed SIG, shared by the header and the admin panel. */
export function useSigDirectory(enabled: boolean = true) {
  return useQuery<Sig[], Error>({
    queryKey: SIG_LIST_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const result = await apiRequest<Sig[]>("/sig/list", { signal });
      if (!result.ok) {
        throw new ApiError(result);
      }
      if (!Array.isArray(result.data)) {
        throw new ApiError({
          ok: false,
          kind: "invalid-response",
          status: result.status,
          httpStatus: result.httpStatus,
          message: describeFailure("invalid-response"),
          body: result.body,
        });
      }
      return result.data.filter(
        (sig) => sig && typeof sig._id === "string" && sig.name,
      );
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * The caller's main role. A content moderator who also leads or advises a
 * SIG is "moderator" with `managedSigIds`, and sees both scopes.
 */
export type AdminRole = "admin" | "moderator" | "manager";

export type AdminAccess =
  | { status: "loading" }
  | { status: "none" }
  | { status: "error"; message: string; retry: () => void }
  | {
      status: AdminRole;
      userId: string;
      /** SIGs the user leads or advises (empty for admins). */
      managedSigIds: string[];
    };

/** Every role whose sections the caller sees. */
export function viewerRoles(role: AdminRole, managedSigIds: string[]) {
  if (role === "moderator" && managedSigIds.length > 0) {
    return ["moderator", "manager"] as AdminRole[];
  }
  return [role];
}

/** True for /admin and everything below it. */
export function isAdminPath(pathname: string | null | undefined) {
  return pathname === "/admin" || Boolean(pathname?.startsWith("/admin/"));
}

export function managedSigIdsOf(sigs: Sig[], userId: string) {
  return sigs
    .filter(
      (sig) => sig.leader?.includes(userId) || sig.moderator?.includes(userId),
    )
    .map((sig) => sig._id);
}

export function useAdminAccess(): AdminAccess {
  const { isLoading, isLogin, userData } = useUserAccount();
  const userId = userData?._id ?? "";
  const isAdmin = isLogin && userData?.permission === ADMIN_PERMISSION;
  const isModerator =
    isLogin && userData?.permission === CONTENT_MODERATOR_PERMISSION;
  const directory = useSigDirectory(
    isLogin && !isLoading && !isAdmin && Boolean(userId),
  );

  if (isLoading) {
    return { status: "loading" };
  }
  if (!isLogin || !userId) {
    return { status: "none" };
  }
  if (isAdmin) {
    return { status: "admin", userId, managedSigIds: [] };
  }
  if (directory.isPending) {
    return { status: "loading" };
  }
  if (directory.isError && isModerator) {
    // The moderator scope does not depend on the SIG list.
    return { status: "moderator", userId, managedSigIds: [] };
  }
  if (directory.isError) {
    return {
      status: "error",
      message:
        directory.error instanceof ApiError
          ? directory.error.message
          : describeFailure("error"),
      retry: () => {
        void directory.refetch();
      },
    };
  }
  const managedSigIds = managedSigIdsOf(directory.data ?? [], userId);
  if (isModerator) {
    return { status: "moderator", userId, managedSigIds };
  }
  if (managedSigIds.length === 0) {
    return { status: "none" };
  }
  return { status: "manager", userId, managedSigIds };
}

/**
 * What the site chrome does on this page: the header shows 「管理平台」 to
 * whoever may open the panel (admins, content moderators, SIG managers), and inside the panel 「回到網站」 instead,
 * with no dock. Visitors who get the 404 page keep the normal chrome.
 */
export function useAdminChrome() {
  const onAdminPath = isAdminPath(usePathname());
  const access = useAdminAccess();
  const canOpenAdmin =
    access.status === "admin" ||
    access.status === "moderator" ||
    access.status === "manager";
  return {
    canOpenAdmin,
    inAdmin: onAdminPath && canOpenAdmin,
    /** Also while the access check runs, so the dock does not flash. */
    hideDock: onAdminPath && access.status !== "none",
  };
}

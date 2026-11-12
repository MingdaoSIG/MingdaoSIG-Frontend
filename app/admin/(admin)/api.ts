"use client";

import {
  keepPreviousData,
  type QueryKey,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  ApiError,
  type ApiFailure,
  type ApiResult,
  apiRequest,
  describeFailure,
} from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import sigAPI from "@/modules/sigAPI";
import { ANNOUNCEMENT_SIG_ID, useSigDirectory } from "@/utils/useAdminAccess";
import type {
  AdminComment,
  AdminPost,
  AdminReport,
  AdminSig,
  AdminUser,
  AdminUserDetail,
  AuditEntry,
  JoinRequest,
  ListPage,
  Overview,
  ReportAction,
  ReportKind,
  ReportStatusFilter,
  SigMember,
} from "./types";

// Calls to the admin API (design/api-contract-v3.md §3). Reads go through
// react-query so the sidebar badge, the overview and each list share one
// cache; every write invalidates what it changed. Requests use the
// signed-in user's token (`auth: true`), and the pages only enable them
// once the admin shell knows the caller's role.

export const PAGE_SIZE = 50;
/** The backend refuses longer search strings. */
export const SEARCH_MAX_LENGTH = 100;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const HAS_CJK = /[㐀-鿿]/;
const OBJECT_ID = /^[0-9a-f]{24}$/i;

export function isObjectId(value: string | null | undefined) {
  return Boolean(value && OBJECT_ID.test(value));
}

/** An avatar or cover: a full URL, or a bare image id from POST /image. */
export function imageUrl(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  if (OBJECT_ID.test(value)) {
    return `${API_URL}/image/${value}`;
  }
  return value;
}

/** True when a backend message is already written for people (Chinese). */
export function isChinese(message: string) {
  return HAS_CJK.test(message);
}

/** The `message` the backend sent with a refusal, if any. */
export function backendMessage(failure: ApiFailure) {
  const body = failure.body;
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    return typeof message === "string" ? message.trim() : "";
  }
  return "";
}

/**
 * Refused for lack of permission. The admin routes answer 403, but the
 * older routes they extend (POST /sig/:id, /sig/:sigId/members, leader and
 * moderator) answer HTTP 400 with status 4001, so the status decides.
 */
export function isForbidden(failure: ApiFailure) {
  return (
    failure.status === CustomStatus.FORBIDDEN ||
    (failure.httpStatus === 403 && failure.status === null)
  );
}

/** A Traditional Chinese explanation of a failed admin request. */
export function failureMessage(
  failure: ApiFailure,
  forbidden: string = "你沒有權限執行這個操作",
) {
  if (isForbidden(failure)) {
    const message = backendMessage(failure);
    return message && isChinese(message) ? message : forbidden;
  }
  if (failure.status === CustomStatus.INVALID_QUERY) {
    return "篩選條件無效，請重新設定";
  }
  if (failure.status === CustomStatus.INVALID_BODY) {
    return "送出的資料格式不正確，請重新整理後再試";
  }
  return failure.message;
}

function invalidResponse(result: ApiResult<unknown>) {
  return new ApiError({
    ok: false,
    kind: "invalid-response",
    status: result.status,
    httpStatus: result.httpStatus,
    message: describeFailure("invalid-response"),
    body: result.body,
  });
}

function readError(failure: ApiFailure) {
  return new ApiError({
    ...failure,
    message: failureMessage(failure, "你沒有權限查看這些資料"),
  });
}

type Query = Record<string, string | number | undefined>;

export async function getData<T>(
  path: string,
  query?: Query,
  signal?: AbortSignal,
): Promise<T> {
  const result = await apiRequest<T>(path, { auth: true, query, signal });
  if (!result.ok) {
    throw readError(result);
  }
  if (result.data === undefined || result.data === null) {
    throw invalidResponse(result);
  }
  return result.data;
}

export async function getPage<T extends { _id: string }>(
  path: string,
  query: Query,
  signal?: AbortSignal,
): Promise<ListPage<T>> {
  const result = await apiRequest<T[]>(path, { auth: true, query, signal });
  if (!result.ok) {
    throw readError(result);
  }
  if (!Array.isArray(result.data)) {
    throw invalidResponse(result);
  }
  const reported = result.body.total;
  const items = result.data.filter(
    (item) => item && typeof item._id === "string",
  );
  return {
    items,
    total:
      typeof reported === "number" && reported >= 0 ? reported : items.length,
  };
}

/** A write. Never throws; the caller shows the outcome. */
export function send<T = unknown>(
  path: string,
  options: { method?: "POST" | "DELETE"; body?: unknown } = {},
) {
  return apiRequest<T>(path, {
    method: options.method ?? "POST",
    body: options.body,
    auth: true,
  });
}

export function errorText(error: unknown) {
  return error instanceof ApiError ? error.message : describeFailure("error");
}

// ---- Query keys ------------------------------------------------------

export const adminKeys = {
  all: ["admin"] as const,
  overview: ["admin", "overview"] as const,
  posts: ["admin", "posts"] as const,
  comments: ["admin", "comments"] as const,
  users: ["admin", "users"] as const,
  user: (id: string) => ["admin", "users", "detail", id] as const,
  sigs: ["admin", "sigs"] as const,
  sigMembers: (id: string) => ["admin", "sig-members", id] as const,
  joinRequests: ["admin", "join-requests"] as const,
  pendingCount: ["admin", "join-requests", "pending-count"] as const,
  reports: ["admin", "reports"] as const,
  // Under `reports`, so invalidating the reports also refreshes the badge.
  openReportCount: ["admin", "reports", "open-count"] as const,
  audit: ["admin", "audit"] as const,
};

/** Refetch everything under these keys (active queries right away). */
export function useInvalidate() {
  const queryClient = useQueryClient();
  return useCallback(
    (...keys: QueryKey[]) =>
      Promise.all(
        keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
    [queryClient],
  );
}

/** Updates one item in every cached page of a list (after a write). */
export function usePatchList<T extends { _id: string }>(key: QueryKey) {
  const queryClient = useQueryClient();
  return useCallback(
    (id: string, patch: Partial<T>) => {
      queryClient.setQueriesData<ListPage<T>>({ queryKey: key }, (old) =>
        old && Array.isArray(old.items)
          ? {
              ...old,
              items: old.items.map((item) =>
                item._id === id ? { ...item, ...patch } : item,
              ),
            }
          : old,
      );
    },
    [queryClient, key],
  );
}

// ---- Reads -----------------------------------------------------------

export function useOverview(enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.overview,
    queryFn: ({ signal }) =>
      getData<Overview>("/admin/overview", undefined, signal),
    enabled,
  });
}

export type PostQuery = {
  skip: number;
  limit: number;
  q?: string;
  sig?: string;
  status?: string;
  sort?: string;
};

export function usePosts(query: PostQuery, enabled: boolean = true) {
  return useQuery({
    queryKey: [...adminKeys.posts, query],
    queryFn: ({ signal }) => getPage<AdminPost>("/admin/posts", query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export type CommentQuery = {
  skip: number;
  limit: number;
  q?: string;
  post?: string;
  user?: string;
  status?: string;
};

export function useComments(query: CommentQuery) {
  return useQuery({
    queryKey: [...adminKeys.comments, query],
    queryFn: ({ signal }) =>
      getPage<AdminComment>("/admin/comments", query, signal),
    placeholderData: keepPreviousData,
  });
}

export type UserQuery = {
  skip: number;
  limit: number;
  q?: string;
  role?: string;
  sig?: string;
  /** 1: only users with a mute or ban in force (contract v4 §5.1). */
  suspended?: number;
};

export function useUsers(query: UserQuery, enabled: boolean = true) {
  return useQuery({
    queryKey: [...adminKeys.users, "list", query],
    queryFn: ({ signal }) => getPage<AdminUser>("/admin/users", query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useUserDetail(id: string | null) {
  return useQuery({
    queryKey: adminKeys.user(id ?? ""),
    queryFn: ({ signal }) =>
      getData<AdminUserDetail>(`/admin/users/${id}`, undefined, signal),
    enabled: Boolean(id),
  });
}

/** Admins get every SIG; a manager only the SIGs they manage. */
export function useAdminSigs(enabled: boolean = true) {
  return useQuery({
    queryKey: adminKeys.sigs,
    queryFn: async ({ signal }) => {
      const page = await getPage<AdminSig>("/admin/sigs", {}, signal);
      return page.items.map((sig) => ({
        ...sig,
        leaders: Array.isArray(sig.leaders) ? sig.leaders : [],
        moderators: Array.isArray(sig.moderators) ? sig.moderators : [],
      }));
    },
    enabled,
  });
}

export type JoinQuery = {
  skip: number;
  limit: number;
  sig?: string;
  status?: string;
};

export function useJoinRequests(query: JoinQuery, enabled: boolean = true) {
  return useQuery({
    queryKey: [...adminKeys.joinRequests, "list", query],
    queryFn: ({ signal }) =>
      getPage<JoinRequest>("/admin/join-requests", query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Pending join requests the caller may decide (the sidebar badge). */
export function usePendingCount(enabled: boolean = true) {
  return useQuery({
    queryKey: adminKeys.pendingCount,
    queryFn: async ({ signal }) => {
      const page = await getPage<JoinRequest>(
        "/admin/join-requests",
        { status: "pending", skip: 0, limit: 1 },
        signal,
      );
      return page.total;
    },
    enabled,
    refetchInterval: 2 * 60 * 1000,
  });
}

export type ReportQuery = {
  skip: number;
  limit: number;
  status?: ReportStatusFilter;
  kind?: ReportKind;
};

/** The backend is new: a report without a target still gets one. */
function normalizeReport(report: AdminReport): AdminReport {
  const target: Partial<AdminReport["target"]> =
    report.target && typeof report.target === "object" ? report.target : {};
  return {
    ...report,
    reporter: report.reporter ?? null,
    target: {
      ...target,
      kind: target.kind === "comment" ? "comment" : "post",
      id: typeof target.id === "string" ? target.id : "",
    },
  };
}

/** Reports on posts and comments (admins only). */
export function useReports(query: ReportQuery, enabled: boolean = true) {
  return useQuery({
    queryKey: [...adminKeys.reports, "list", query],
    queryFn: async ({ signal }) => {
      const page = await getPage<AdminReport>("/admin/reports", query, signal);
      return { ...page, items: page.items.map(normalizeReport) };
    },
    placeholderData: keepPreviousData,
    enabled,
  });
}

/**
 * Open reports (the sidebar badge). The route is admin-only, so pass
 * `role === "admin"`: a manager must not fetch it.
 */
export function useOpenReportCount(enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.openReportCount,
    queryFn: async ({ signal }) => {
      const page = await getPage<AdminReport>(
        "/admin/reports",
        { status: "open", skip: 0, limit: 1 },
        signal,
      );
      return page.total;
    },
    enabled,
    refetchInterval: 2 * 60 * 1000,
  });
}

/** 移除內容 or 不處理. The reporter is told `resolution`. */
export function resolveReport(
  id: string,
  action: ReportAction,
  resolution: string,
) {
  return send<Partial<AdminReport>>(`/admin/reports/${id}/resolve`, {
    body: { action, resolution },
  });
}

export type AuditQuery = {
  skip: number;
  limit: number;
  action?: string;
  actor?: string;
  targetKind?: string;
  targetId?: string;
};

export function useAudit(query: AuditQuery) {
  return useQuery({
    queryKey: [...adminKeys.audit, query],
    queryFn: ({ signal }) => getPage<AuditEntry>("/admin/audit", query, signal),
    placeholderData: keepPreviousData,
  });
}

/**
 * Email and student number are private. If the member list ever comes back
 * without them, admins fill them in from each member's full profile; a
 * member whose profile cannot be read keeps the blanks. Managers cannot
 * read other profiles, so they get the list as it is.
 */
async function withPrivateFields(members: SigMember[], token: string | null) {
  const incomplete = members.filter((m) => m._id && !m.email);
  if (!token || incomplete.length === 0) {
    return members;
  }
  const results = await Promise.allSettled(
    incomplete.map((m) => sigAPI.getFullUserData(m._id, token)),
  );
  const full = new Map<string, Partial<SigMember>>();
  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    if (result.status === "fulfilled" && result.value) {
      full.set(incomplete[index]._id, result.value as Partial<SigMember>);
    }
  }
  return members.map((m) => {
    const extra = full.get(m._id);
    if (!extra) {
      return m;
    }
    return {
      ...m,
      code: m.code || extra.code || "",
      email: m.email || extra.email || "",
      class: m.class || extra.class || "",
    };
  });
}

export async function fetchSigMembers(
  sigId: string,
  options: { enrichWith: string | null; signal?: AbortSignal },
): Promise<SigMember[]> {
  const result = await apiRequest<SigMember[]>(`/sig/${sigId}/members`, {
    auth: true,
    signal: options.signal,
  });
  if (!result.ok) {
    throw readError(result);
  }
  if (!Array.isArray(result.data)) {
    throw invalidResponse(result);
  }
  const members = result.data
    .filter((m) => m && typeof m._id === "string")
    .map((m) => ({
      _id: m._id,
      code: m.code || "",
      name: m.name || "",
      email: m.email || "",
      class: m.class || "",
      customId: m.customId || "",
      identity: m.identity,
      avatar: m.avatar || "",
    }));
  return withPrivateFields(members, options.enrichWith);
}

export function useSigMembers(
  sigId: string | null,
  enrichWith: string | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: adminKeys.sigMembers(sigId ?? ""),
    queryFn: ({ signal }) =>
      fetchSigMembers(sigId ?? "", { enrichWith, signal }),
    enabled: enabled && Boolean(sigId),
  });
}

/** SIG id → name, including the announcement SIG (not in /sig/list). */
export function useSigNames(enabled: boolean = true) {
  const directory = useSigDirectory(enabled);
  const names = useMemo(() => {
    const map = new Map<string, string>([[ANNOUNCEMENT_SIG_ID, "公告"]]);
    for (const sig of directory.data ?? []) {
      map.set(sig._id, sig.name);
    }
    return map;
  }, [directory.data]);
  return { names, sigs: directory.data ?? [], directory };
}

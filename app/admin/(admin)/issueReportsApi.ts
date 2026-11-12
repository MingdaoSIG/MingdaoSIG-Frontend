"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiError, apiRequest } from "@/modules/api/client";
import {
  type IssueCategory,
  type IssueReport,
  type IssueStatus,
  normalizeIssueReport,
} from "@/modules/issueReports";
import { failureMessage, getData, send } from "./api";

// 問題回報 for admins (contract v4 §7): the list with its 待處理 count,
// one report, and the status / reply update. Admin-only routes.

export type IssuePerson = {
  _id: string;
  name: string;
  customId: string;
  email: string;
  avatar: string;
};

export type AdminIssueReport = IssueReport & {
  reporter: IssuePerson | null;
  handledBy: IssuePerson | null;
};

export type IssueStatusFilter = IssueStatus | "active" | "all";

export type IssueQuery = {
  skip: number;
  limit: number;
  status: IssueStatusFilter;
  category?: IssueCategory;
  q?: string;
};

export type IssuePage = {
  items: AdminIssueReport[];
  total: number;
  openCount: number;
};

export const issueKeys = {
  all: ["admin", "issue-reports"] as const,
  list: (query: IssueQuery) => ["admin", "issue-reports", "list", query],
  detail: (id: string) => ["admin", "issue-reports", "detail", id],
  // Under `all`, so invalidating the reports also refreshes the badge.
  openCount: ["admin", "issue-reports", "open-count"] as const,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function person(value: unknown): IssuePerson | null {
  if (!isRecord(value) || typeof value._id !== "string" || !value._id) {
    return null;
  }
  const text = (key: string) =>
    typeof value[key] === "string" ? (value[key] as string) : "";
  return {
    _id: value._id,
    name: text("name"),
    customId: text("customId"),
    email: text("email"),
    avatar: text("avatar"),
  };
}

export function normalizeAdminIssue(value: unknown): AdminIssueReport | null {
  const report = normalizeIssueReport(value);
  if (!report || !isRecord(value)) {
    return null;
  }
  return {
    ...report,
    reporter: person(value.reporter),
    handledBy: person(value.handledBy),
  };
}

async function fetchIssuePage(
  query: IssueQuery,
  signal?: AbortSignal,
): Promise<IssuePage> {
  const result = await apiRequest<unknown>("/admin/issue-reports", {
    auth: true,
    query: {
      skip: query.skip,
      limit: query.limit,
      status: query.status,
      category: query.category,
      q: query.q || undefined,
    },
    signal,
  });
  if (!result.ok) {
    throw new ApiError({
      ...result,
      message: failureMessage(result, "你沒有權限查看這些資料"),
    });
  }
  const items = Array.isArray(result.data)
    ? result.data.flatMap((item) => {
        const report = normalizeAdminIssue(item);
        return report ? [report] : [];
      })
    : [];
  const number = (key: string, fallback: number) => {
    const value = result.body[key];
    return typeof value === "number" && value >= 0 ? value : fallback;
  };
  return {
    items,
    total: number("total", items.length),
    openCount: number("openCount", 0),
  };
}

export function useIssueReports(query: IssueQuery) {
  return useQuery({
    queryKey: issueKeys.list(query),
    queryFn: ({ signal }) => fetchIssuePage(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** One report, for `?id=` when it is not on the current page. */
export function useIssueReport(id: string | null) {
  return useQuery({
    queryKey: issueKeys.detail(id ?? ""),
    queryFn: async ({ signal }) => {
      const data = await getData<unknown>(
        `/admin/issue-reports/${id}`,
        undefined,
        signal,
      );
      const report = normalizeAdminIssue(data);
      if (!report) {
        throw new Error("invalid issue report");
      }
      return report;
    },
    enabled: Boolean(id),
    retry: false,
  });
}

/** 待處理 reports, for the sidebar badge. Admins only. */
export function useOpenIssueCount(enabled: boolean) {
  return useQuery({
    queryKey: issueKeys.openCount,
    queryFn: async ({ signal }) => {
      const page = await fetchIssuePage(
        { status: "open", skip: 0, limit: 1 },
        signal,
      );
      return page.openCount;
    },
    enabled,
    refetchInterval: 2 * 60 * 1000,
  });
}

/** Sets the status and / or the reply; the backend notifies the reporter. */
export function updateIssueReport(
  id: string,
  body: { status?: IssueStatus; reply?: string },
) {
  return send<unknown>(`/admin/issue-reports/${id}`, { body });
}

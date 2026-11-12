"use client";

import { useQuery } from "@tanstack/react-query";
import type { TSeries } from "@/interfaces/Reading";
import type { TThread } from "@/interfaces/Thread";
import { ApiError, apiRequest } from "@/modules/api/client";

// Series (contract v4 §4.4): an author's ordered list of their own posts.

export const SERIES_TITLE_MAX = 60;
export const SERIES_DESCRIPTION_MAX = 300;

export const seriesKeys = {
  all: ["series"] as const,
  detail: (id: string) => ["series", "detail", id] as const,
  ofUser: (userId: string) => ["series", "user", userId] as const,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Keeps only well-formed series; posts may be ids or list items. */
export function toSeries(value: unknown): TSeries | null {
  if (!isRecord(value) || typeof value._id !== "string") {
    return null;
  }
  const posts = Array.isArray(value.posts)
    ? value.posts.filter(
        (post): post is TThread | string =>
          typeof post === "string" ||
          (isRecord(post) && typeof post._id === "string"),
      )
    : [];
  return {
    ...(value as unknown as TSeries),
    title: typeof value.title === "string" ? value.title : "",
    posts,
  };
}

/** How many posts a series holds. */
export function seriesCount(series: TSeries) {
  return typeof series.postCount === "number"
    ? series.postCount
    : series.posts.length;
}

/** The post ids of a series, in order. */
export function seriesPostIds(series: TSeries): string[] {
  return series.posts.map((post) =>
    typeof post === "string" ? post : (post._id ?? ""),
  );
}

export function useSeries(id: string | null | undefined) {
  return useQuery({
    queryKey: seriesKeys.detail(id ?? ""),
    queryFn: async ({ signal }) => {
      const result = await apiRequest<unknown>(`/series/${id}`, { signal });
      if (!result.ok) {
        throw new ApiError(result);
      }
      const series = toSeries(result.data);
      if (!series) {
        throw new ApiError({
          ok: false,
          kind: "invalid-response",
          status: result.status,
          httpStatus: result.httpStatus,
          message: "伺服器暫時無法回應，請稍後再試",
          body: result.body,
        });
      }
      return series;
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useUserSeries(userId: string | null | undefined) {
  return useQuery({
    queryKey: seriesKeys.ofUser(userId ?? ""),
    queryFn: async ({ signal }) => {
      const result = await apiRequest<unknown>(`/user/${userId}/series`, {
        signal,
      });
      if (!result.ok) {
        throw new ApiError(result);
      }
      const list = Array.isArray(result.data) ? result.data : [];
      return list
        .map(toSeries)
        .filter((series): series is TSeries => series !== null);
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });
}

export type SeriesInput = {
  title?: string;
  description?: string;
  posts?: string[];
};

export function createSeries(input: SeriesInput) {
  return apiRequest<unknown>("/series", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export function updateSeries(id: string, input: SeriesInput) {
  return apiRequest<unknown>(`/series/${id}`, {
    method: "POST",
    auth: true,
    body: input,
  });
}

export function deleteSeries(id: string) {
  return apiRequest(`/series/${id}`, { method: "DELETE", auth: true });
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NotFoundPage from "@/app/not-found";
import type { TThread } from "@/interfaces/Thread";
import {
  type ApiFailure,
  apiRequest,
  describeFailure,
} from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

// Admin post list, one page at a time from GET /post/list/admin (newest
// first, removed posts left out). Nothing is fetched until the signed-in
// account is known to be an admin.

const PAGE_SIZE = 50;
const SEARCH_DELAY_MS = 300;
/** The backend rejects longer title searches. */
const SEARCH_MAX_LENGTH = 100;

type AdminPost = Pick<
  TThread,
  "_id" | "title" | "sig" | "user" | "createdAt" | "pinned" | "likes"
>;

type ListStatus = "loading" | "ready" | "error";

function failureMessage(failure: ApiFailure) {
  if (failure.httpStatus === 403 || failure.status === CustomStatus.FORBIDDEN) {
    return "你沒有管理員權限，無法查看貼文列表";
  }
  return failure.message;
}

function formatDate(iso?: string) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** One page of the admin post list; refetches when any input changes. */
function useAdminPosts({
  enabled,
  token,
  page,
  query,
}: {
  enabled: boolean;
  token: string | null;
  page: number;
  query: string;
}) {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ListStatus>("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  // A refreshed token must not refetch the page: apiRequest already
  // retries with it.
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const controller = new AbortController();
    const skip = (page - 1) * PAGE_SIZE;
    setStatus("loading");
    setError("");

    (async () => {
      const result = await apiRequest<AdminPost[]>("/post/list/admin", {
        token: tokenRef.current,
        query: { skip, limit: PAGE_SIZE, q: query || undefined },
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return;
      }
      if (!result.ok) {
        setPosts([]);
        setError(failureMessage(result));
        setStatus("error");
        return;
      }
      if (!Array.isArray(result.data)) {
        setPosts([]);
        setError(describeFailure("invalid-response"));
        setStatus("error");
        return;
      }
      const reported = result.body.total;
      setPosts(result.data.filter((post) => typeof post?._id === "string"));
      setTotal(
        typeof reported === "number" && reported >= 0
          ? reported
          : skip + result.data.length,
      );
      setStatus("ready");
    })();

    return () => controller.abort();
  }, [enabled, page, query, attempt]);

  return {
    posts,
    total,
    status,
    error,
    retry: () => setAttempt((n) => n + 1),
  };
}

export default function ManagePost() {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();

  const isAdmin = userAccount.isLogin && userAccount.userData?.permission === 2;

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  // Where a new page starts: the card above the list on mobile, the
  // scrolling table body on desktop.
  const listTop = useRef<HTMLDivElement>(null);
  const tableBody = useRef<HTMLDivElement>(null);

  // Search after typing stops; a new search starts on page 1.
  useEffect(() => {
    const next = search.trim().slice(0, SEARCH_MAX_LENGTH);
    if (next === query) {
      return;
    }
    const timer = setTimeout(() => {
      setQuery(next);
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, query]);

  const { posts, total, status, error, retry } = useAdminPosts({
    enabled: isAdmin,
    token: userAccount.token,
    page,
    query,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Posts removed meanwhile can leave us past the last page.
  useEffect(() => {
    if (status === "ready" && page > totalPages) {
      setPage(totalPages);
    }
  }, [status, page, totalPages]);

  if (userAccount.isLoading === true) {
    return <div></div>;
  }

  if (!isAdmin) {
    return <NotFoundPage />;
  }

  const handleBack = () => {
    router.push("/admin");
  };

  const openPost = (post: AdminPost) => {
    router.push(`/admin/post/${post._id}`);
  };

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    listTop.current?.scrollIntoView({ block: "start" });
    tableBody.current?.scrollTo({ top: 0 });
  };

  const loading = status === "loading";
  const emptyMessage = query
    ? `找不到標題含「${query}」的貼文`
    : "暫無貼文資料";

  const searchInput = (id: string, className: string) => (
    <input
      id={id}
      type="search"
      value={search}
      maxLength={SEARCH_MAX_LENGTH}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="搜尋貼文標題"
      aria-label="搜尋貼文標題"
      className={className}
    />
  );

  const pager = (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => goToPage(page - 1)}
        disabled={loading || page <= 1}
        className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 font-medium text-sm text-white shadow-sm transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        上一頁
      </button>
      <div className="text-center text-gray-600 text-sm">
        <p className="font-medium">
          第 {Math.min(page, totalPages)} / {totalPages} 頁
        </p>
        <p className="text-gray-400 text-xs">共 {total} 篇</p>
      </div>
      <button
        type="button"
        onClick={() => goToPage(page + 1)}
        disabled={loading || page >= totalPages}
        className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 font-medium text-sm text-white shadow-sm transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        下一頁
      </button>
    </div>
  );

  const errorBox = (
    <div role="alert" className="py-12 text-center">
      <p className="mb-3 text-gray-600">{error}</p>
      <button
        type="button"
        onClick={retry}
        className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 text-sm shadow-sm transition-colors hover:bg-gray-50"
      >
        重試
      </button>
    </div>
  );

  const pinnedChip = (
    <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 text-xs">
      置頂
    </span>
  );

  return isMobile ? (
    <div className="h-[calc(100dvh-8rem)] w-full overflow-y-auto bg-gradient-to-br from-blue-50 to-cyan-50 px-4 pt-4 pb-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-gray-600 shadow-md transition-colors hover:bg-gray-50"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="font-bold text-gray-800 text-xl">貼文管理</h1>
          <div className="w-10"></div>
        </div>

        {/* Title Card */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">
              📝
            </div>
            <div>
              <h2 className="font-bold text-lg">貼文管理</h2>
              <p className="text-sm text-white/80">選擇要管理的貼文</p>
            </div>
          </div>
        </div>

        {/* Stats + Search */}
        <div
          ref={listTop}
          className="mb-4 scroll-mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                {query ? "符合的貼文" : "目前貼文數量"}
              </p>
              <p className="font-bold text-2xl text-blue-600">共 {total} 篇</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xl">
              📄
            </div>
          </div>
          {searchInput(
            "mobile-post-search",
            "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
          )}
        </div>

        {/* Post List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-blue-500 border-b-2"></div>
          </div>
        ) : status === "error" ? (
          errorBox
        ) : posts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-3xl">
              📝
            </div>
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post._id}
                onClick={() => openPost(post)}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-md transition-all hover:shadow-lg"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {post.pinned && pinnedChip}
                    <p className="truncate font-medium text-gray-800">
                      {post.title}
                    </p>
                  </div>
                  <p className="mt-1 text-gray-400 text-xs">
                    ID: {post._id?.slice(-6)}
                    {post.createdAt && ` · ${formatDate(post.createdAt)}`}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex-shrink-0 rounded-lg bg-blue-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-600"
                >
                  管理
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {status !== "error" && (
          <div className="mt-4 rounded-xl border border-gray-100 bg-white p-3 shadow-md">
            {pager}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="relative h-[calc(100%-6.5rem)] pt-5">
      <div className="mb-6 flex w-full text-center">
        <button
          type="button"
          onClick={handleBack}
          className="mx-auto cursor-pointer rounded-full bg-gray-100 px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-200"
        >
          ← 返回
        </button>
      </div>
      <div className="flex h-full flex-col items-center justify-start">
        <h1 className="mb-6 font-bold text-3xl text-gray-800">貼文管理</h1>
        <div className="mb-3 flex w-full max-w-4xl items-center justify-between gap-4">
          {searchInput(
            "desktop-post-search",
            "w-80 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
          )}
          {/* Above the table: the floating toolbar covers the page bottom */}
          {status !== "error" && <div className="w-88">{pager}</div>}
        </div>
        <div className="w-full max-w-4xl overflow-x-auto rounded-lg shadow-lg">
          <div className="h-full overflow-hidden rounded-lg shadow-lg">
            <table className="min-w-full rounded-lg bg-white">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <tr className="flex text-center">
                  <th className="w-7/12 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                    貼文名稱
                  </th>
                  <th className="w-3/12 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                    建立時間
                  </th>
                  <th className="w-2/12 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
            </table>
            <div
              ref={tableBody}
              className="remove-scrollbar max-h-[52dvh] w-full overflow-y-auto"
            >
              {loading ? (
                <div className="flex justify-center bg-white py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-blue-500 border-b-2"></div>
                </div>
              ) : status === "error" ? (
                <div className="bg-white">{errorBox}</div>
              ) : posts.length === 0 ? (
                <div className="bg-white py-12 text-center text-gray-500">
                  <p className="text-lg">{emptyMessage}</p>
                </div>
              ) : (
                <table className="min-w-full bg-white">
                  <tbody className="divide-y divide-gray-200">
                    {posts.map((post, index) => (
                      <tr
                        key={post._id}
                        className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} flex items-center text-center transition-colors duration-200 hover:bg-blue-50`}
                      >
                        <td className="flex w-7/12 items-center justify-center gap-2 px-2 py-2 text-center font-medium text-gray-900 text-sm">
                          {post.pinned && pinnedChip}
                          <span className="truncate" title={post.title}>
                            {post.title}
                          </span>
                        </td>
                        <td className="w-3/12 py-2 text-center text-gray-500 text-sm">
                          {formatDate(post.createdAt)}
                        </td>
                        <td className="w-2/12 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => openPost(post)}
                            className="inline-flex cursor-pointer rounded-lg bg-blue-500 px-3 py-2 font-medium text-sm text-white shadow-sm transition-all duration-200 hover:bg-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            管理貼文
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

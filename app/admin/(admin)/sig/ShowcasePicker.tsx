"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { featuredPostsOf } from "@/components/SigShowcase/SigShowcase";
import type { TThread } from "@/interfaces/Thread";
import { ApiError, apiRequest } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { SIG_LIST_QUERY_KEY } from "@/utils/useAdminAccess";
import useSig from "@/utils/useSig";
import { failureMessage, send, useInvalidate } from "../api";
import { Badge, Button, Card, ErrorState, Spinner } from "../components/ui";
import { formatDate } from "../format";
import type { AdminSig } from "../types";

// 精選成果 picker in 基本資料 (contract v4 §3.4): up to six of the SIG's
// posts, in order, saved with POST /sig/:id { featuredPosts }. The saved
// showcase comes from GET /sig/:id (resolved posts); the candidates from
// the SIG's public post list, newest first.

const MAX = 6;
const PAGE_SIZE = 20;

type Pick = { _id: string; title: string; createdAt?: string };

function useSigPosts(sigId: string) {
  return useInfiniteQuery<TThread[], Error>({
    queryKey: ["admin", "sig-posts", sigId],
    queryFn: async ({ pageParam, signal }) => {
      const result = await apiRequest<TThread[]>(
        `/post/list/sig/${encodeURIComponent(sigId)}`,
        {
          query: {
            skip: Number(pageParam) * PAGE_SIZE,
            limit: PAGE_SIZE,
            sort: "latest",
          },
          signal,
        },
      );
      if (!result.ok) {
        throw new ApiError(result);
      }
      return Array.isArray(result.data)
        ? result.data.filter((post) => typeof post?._id === "string")
        : [];
    },
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      last.length === PAGE_SIZE ? pages.length : undefined,
  });
}

export function ShowcasePicker({ sig }: { sig: AdminSig }) {
  const invalidate = useInvalidate();
  const saved = useSig(sig._id);
  const posts = useSigPosts(sig._id);
  const initial = useMemo<Pick[]>(
    () =>
      featuredPostsOf(saved.data).map((post) => ({
        _id: post._id,
        title: post.title,
        createdAt: post.createdAt,
      })),
    [saved.data],
  );
  const [picked, setPicked] = useState<Pick[]>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPicked(initial);
    setError(null);
  }, [initial]);

  const candidates = posts.data?.pages.flat() ?? [];
  const pickedIds = new Set(picked.map((post) => post._id));
  const dirty =
    picked.length !== initial.length ||
    picked.some((post, index) => post._id !== initial[index]?._id);

  const move = (index: number, by: number) => {
    setPicked((list) => {
      const next = [...list];
      const target = index + by;
      if (target < 0 || target >= next.length) {
        return list;
      }
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const result = await send(`/sig/${sig._id}`, {
      body: { featuredPosts: picked.map((post) => post._id) },
    });
    setSaving(false);
    if (!result.ok) {
      const message =
        result.status === CustomStatus.INVALID_BODY
          ? "有貼文已被下架或不屬於這個 SIG，請重新選擇後再儲存"
          : failureMessage(result, "你沒有權限編輯這個 SIG");
      setError(message);
      toast.error(message);
      if (result.status === CustomStatus.INVALID_BODY) {
        void posts.refetch();
      }
      return;
    }
    toast.success("已更新精選成果");
    await invalidate(["sig", sig._id], SIG_LIST_QUERY_KEY);
  };

  return (
    <Card
      title="精選成果"
      actions={
        <Badge tone={picked.length >= MAX ? "warn" : "mute"}>
          {picked.length} / {MAX}
        </Badge>
      }
    >
      <p className="-mt-1 mb-4 text-ink-500 text-sm">
        挑最多 {MAX} 篇代表作，依順序顯示在 SIG 頁最上方。
      </p>
      {saved.isPending ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section aria-labelledby={`${sig._id}-picked`}>
            <h3
              id={`${sig._id}-picked`}
              className="mb-2 font-semibold text-ink-700 text-xs"
            >
              已選的貼文（依顯示順序）
            </h3>
            {picked.length === 0 ? (
              <p className="rounded-control border border-line border-dashed px-3 py-6 text-center text-ink-500 text-sm">
                還沒有精選貼文，從右邊加入
              </p>
            ) : (
              <ol className="flex flex-col gap-1.5" data-showcase-picked>
                {picked.map((post, index) => (
                  <li
                    key={post._id}
                    className="flex items-center gap-2 rounded-control border border-line bg-field/60 py-1.5 pr-1.5 pl-3"
                  >
                    <span className="w-4 shrink-0 font-semibold text-ink-500 text-xs tabular-nums">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ink-900 text-sm">
                      {post.title || "（無標題）"}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`把「${post.title}」往前移`}
                    >
                      <ArrowUp aria-hidden className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => move(index, 1)}
                      disabled={index === picked.length - 1}
                      aria-label={`把「${post.title}」往後移`}
                    >
                      <ArrowDown aria-hidden className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setPicked((list) =>
                          list.filter((item) => item._id !== post._id),
                        )
                      }
                      aria-label={`移除「${post.title}」`}
                    >
                      <X aria-hidden className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby={`${sig._id}-candidates`}>
            <h3
              id={`${sig._id}-candidates`}
              className="mb-2 font-semibold text-ink-700 text-xs"
            >
              這個 SIG 的貼文
            </h3>
            {posts.isError ? (
              <ErrorState
                message={posts.error.message}
                onRetry={() => void posts.refetch()}
              />
            ) : posts.isPending ? (
              <Spinner />
            ) : candidates.length === 0 ? (
              <p className="py-3 text-ink-500 text-sm">這個 SIG 還沒有貼文</p>
            ) : (
              <div className="custom-scrollbar max-h-80 overflow-y-auto rounded-control border border-line">
                <ul className="divide-y divide-line" data-showcase-candidates>
                  {candidates.map((post) => {
                    const id = post._id ?? "";
                    const inList = pickedIds.has(id);
                    return (
                      <li
                        key={id}
                        className="flex items-center gap-2 py-1.5 pr-1.5 pl-3"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-ink-900 text-sm">
                            {post.title || "（無標題）"}
                          </span>
                          <span className="block text-ink-500 text-xs">
                            {formatDate(post.createdAt)} · {post.likes ?? 0} 讚
                          </span>
                        </span>
                        <Button
                          size="sm"
                          onClick={() =>
                            setPicked((list) => [
                              ...list,
                              {
                                _id: id,
                                title: post.title,
                                createdAt: post.createdAt,
                              },
                            ])
                          }
                          disabled={inList || picked.length >= MAX}
                          aria-label={
                            inList
                              ? `「${post.title}」已在精選中`
                              : `把「${post.title}」加入精選`
                          }
                        >
                          {inList ? (
                            "已加入"
                          ) : (
                            <>
                              <Plus aria-hidden className="size-3.5" />
                              加入
                            </>
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                {posts.hasNextPage && (
                  <div className="border-line border-t p-2 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void posts.fetchNextPage()}
                      loading={posts.isFetchingNextPage}
                    >
                      載入更多
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-danger-700 text-sm">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <Button
          variant="primary"
          onClick={() => void save()}
          loading={saving}
          disabled={!dirty}
        >
          儲存精選
        </Button>
        <Button
          onClick={() => {
            setPicked(initial);
            setError(null);
          }}
          disabled={!dirty || saving}
        >
          取消
        </Button>
      </div>
    </Card>
  );
}

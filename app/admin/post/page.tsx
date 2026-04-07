"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NotFoundPage from "@/app/not-found";
import type { TThread } from "@/interfaces/Thread";
import sigAPI from "@/modules/sigAPI";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

export default function ManagePost() {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();

  const [postList, setPostList] = useState<TThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getPostList();
        setPostList(response.reverse());
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (userAccount.isLoading === true) {
    return <div></div>;
  }

  if (userAccount.isLogin === false && userAccount.isLoading === false) {
    return <NotFoundPage />;
  }

  const userData = userAccount.userData;

  if (userData?.permission !== 2 && userAccount.isLoading === false) {
    return <NotFoundPage />;
  }

  const handleBack = () => {
    router.push("/admin");
  };

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

        {/* Stats */}
        <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">目前貼文數量</p>
              <p className="font-bold text-2xl text-blue-600">
                {postList.length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xl">
              📄
            </div>
          </div>
        </div>

        {/* Post List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-blue-500 border-b-2"></div>
          </div>
        ) : postList.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-3xl">
              📝
            </div>
            <p className="text-gray-500">暫無貼文資料</p>
          </div>
        ) : (
          <div className="space-y-3">
            {postList.map((post) => (
              <div
                key={post._id}
                onClick={() => router.push(`/admin/post/${post._id}`)}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-md transition-all hover:shadow-lg"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="truncate font-medium text-gray-800">
                    {post.title}
                  </p>
                  <p className="mt-1 text-gray-400 text-xs">
                    ID: {post._id?.slice(-6)}
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
        <div className="w-full max-w-4xl overflow-x-auto rounded-lg shadow-lg">
          <div className="h-full overflow-hidden rounded-lg shadow-lg">
            <table className="min-w-full rounded-lg bg-white">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <tr className="flex text-center">
                  <th className="w-10/12 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                    貼文名稱
                  </th>
                  <th className="w-2/12 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
            </table>
            <div className="remove-scrollbar max-h-[62dvh] w-full overflow-y-auto">
              <table className="min-w-full bg-white">
                <tbody className="divide-y divide-gray-200">
                  {postList.map((post, index) => (
                    <tr
                      key={post._id}
                      className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} flex items-center text-center transition-colors duration-200 hover:bg-blue-50`}
                    >
                      <td className="w-10/12 py-2 text-center font-medium text-gray-900 text-sm">
                        {post.title}
                      </td>
                      <td className="w-2/12 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/post/${post._id}`)}
                          className="inline-flex cursor-pointer rounded-lg bg-blue-500 px-3 py-2 font-medium text-sm text-white shadow-sm transition-all duration-200 hover:bg-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          管理貼文
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {postList.length === 0 && (
          <div className="mt-8 text-center text-gray-500">
            <p className="text-lg">暫無貼文資料</p>
          </div>
        )}
      </div>
    </div>
  );
}

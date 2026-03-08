"use client";

import { useUserAccount } from "@/utils/useUserAccount";
import NotFoundPage from "@/app/not-found";
import useIsMobile from "@/utils/useIsMobile";
import { useRouter } from "next/navigation";
import sigAPI from "@/modules/sigAPI";
import { useEffect, useState } from "react";

export default function ManagePost() {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();

  const [postList, setPostList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getPostList();
        setPostList(response.reverse());
      } catch (error: any) {
        console.error(error.message);
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
    <div className="w-full h-[calc(100dvh-8rem)] pt-4 px-4 pb-4 overflow-y-auto bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">貼文管理</h1>
          <div className="w-10"></div>
        </div>

        {/* Title Card */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg p-5 mb-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">📝</div>
            <div>
              <h2 className="text-lg font-bold">貼文管理</h2>
              <p className="text-white/80 text-sm">選擇要管理的貼文</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">目前貼文數量</p>
              <p className="text-2xl font-bold text-blue-600">{postList.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
              📄
            </div>
          </div>
        </div>

        {/* Post List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : postList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📝</div>
            <p className="text-gray-500">暫無貼文資料</p>
          </div>
        ) : (
          <div className="space-y-3">
            {postList.map((post) => (
              <div
                key={post._id}
                onClick={() => router.push(`/admin/post/${post._id}`)}
                className="bg-white rounded-xl shadow-md p-4 border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-medium text-gray-800 truncate">{post.title}</p>
                  <p className="text-xs text-gray-400 mt-1">ID: {post._id.slice(-6)}</p>
                </div>
                <button className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0">
                  管理
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="pt-5 h-[calc(100%-6.5rem)] relative">
      <div className="w-full flex text-center mb-6">
        <button
          onClick={handleBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full mx-auto transition-colors duration-200 cursor-pointer"
        >
          ← 返回
        </button>
      </div>
      <div className="flex flex-col items-center justify-start h-full">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">貼文管理</h1>
        <div className="w-full max-w-4xl overflow-x-auto shadow-lg rounded-lg">
          <div className="shadow-lg rounded-lg h-full overflow-hidden">
            <table className="min-w-full bg-white rounded-lg">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0 z-10">
                <tr className="text-center flex">
                  <th className="py-4 text-center text-sm font-semibold uppercase tracking-wider w-10/12">
                    貼文名稱
                  </th>
                  <th className="py-4 text-center text-sm font-semibold uppercase tracking-wider w-2/12">
                    操作
                  </th>
                </tr>
              </thead>
            </table>
            <div className="overflow-y-auto max-h-[62dvh] remove-scrollbar w-full">
              <table className="min-w-full bg-white">
                <tbody className="divide-y divide-gray-200">
                  {postList.map((post, index) => (
                    <tr
                      key={post._id}
                      className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition-colors duration-200 flex text-center items-center`}
                    >
                      <td className="py-2 text-sm font-medium text-gray-900 w-10/12 text-center">
                        {post.title}
                      </td>
                      <td className="py-2 text-center w-2/12">
                        <button
                          onClick={() => router.push(`/admin/post/${post._id}`)}
                          className="inline-flex px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
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

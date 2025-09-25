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

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getPostList();
        setPostList(response.reverse());
      } catch (error: any) {
        console.error(error.message);
      }
    })();
  }, []);

  if (userAccount.isLoading === true) {
    return (<div></div>);
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
    <div className="flex flex-col justify-start w-screen h-[100dvh] pt-[4rem] pb-[4rem] px-2 relative overflow-y-auto">
      <div className="pt-[1rem] h-full">
        <div className="w-full flex text-center mb-4">
          <button
            onClick={handleBack}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full mx-auto transition-colors duration-200"
          >
            ← 返回
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 pb-4">貼文管理</h1>
          <div className="shadow-lg rounded-lg h-full overflow-hidden">
            <table className="min-w-full bg-white rounded-lg">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0 z-10">
                <tr className="text-center flex">
                  <th className="py-4 text-center text-sm font-semibold uppercase tracking-wider w-9/12">
                    貼文名稱
                  </th>
                  <th className="py-4 text-center text-sm font-semibold uppercase tracking-wider w-3/12">
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
                      <td className="py-2 text-sm font-medium text-gray-900 w-9/12 text-center">
                        {post.title}
                      </td>
                      <td className="py-2 text-center w-3/12">
                        <button
                          onClick={() => router.push(`/admin/post/${post._id}`)}
                          className="inline-flex px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
          {postList.length === 0 && (
            <div className="mt-8 text-center text-gray-500">
              <p className="text-lg">暫無貼文資料</p>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="pt-5 h-[calc(100%-6.5rem)] relative">
      <div className="w-full flex text-center mb-6">
        <button
          onClick={handleBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full mx-auto transition-colors duration-200"
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
                          className="inline-flex px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
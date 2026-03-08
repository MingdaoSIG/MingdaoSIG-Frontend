"use client";

import { useUserAccount } from "@/utils/useUserAccount";
import NotFoundPage from "@/app/not-found";
import useIsMobile from "@/utils/useIsMobile";
import { useRouter } from "next/navigation";
import sigAPI from "@/modules/sigAPI";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function ManageMembersChooseSIG() {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();

  const [sigList, setSigList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigList();
        setSigList(response);
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
    <div className="w-full h-[calc(100dvh-8rem)] pt-4 px-4 pb-4 overflow-y-auto bg-gradient-to-br from-green-50 to-emerald-50">
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
          <h1 className="text-xl font-bold text-gray-800">選擇 SIG</h1>
          <div className="w-10"></div>
        </div>

        {/* Title Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg p-5 mb-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">👥</div>
            <div>
              <h2 className="text-lg font-bold">SIG 成員名單下載</h2>
              <p className="text-white/80 text-sm">選擇要查看的 SIG</p>
            </div>
          </div>
        </div>

        {/* SIG Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sigList
              .filter((sig) => sig._id !== "663b09e19aa7c3d74577a786")
              .map((sig) => (
                <button
                  key={sig._id}
                  onClick={() => router.push(`/admin/sig-members/${sig._id}`)}
                  className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-100 flex flex-col items-center gap-2"
                >
                  {sig.avatar ? (
                    <Image
                      src={sig.avatar}
                      alt={sig.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-xl">
                      {sig.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 text-center line-clamp-2">
                    {sig.name}
                  </span>
                </button>
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
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full mx-auto cursor-pointer transition-colors"
        >
          ← 返回
        </button>
      </div>
      <div className="flex flex-col items-center justify-start h-full">
        <h1 className="text-3xl font-bold mb-4">SIG 成員名單下載</h1>
        <p className="text-xl mb-4">請選擇您要查看的 SIG:</p>
        <div className="grid grid-cols-3 gap-4">
          {sigList.map((sig) => {
            if (sig._id !== "663b09e19aa7c3d74577a786") {
              return (
                <button
                  key={sig._id}
                  id={sig._id}
                  className="bg-white text-[#5fcdf5] px-4 py-2 rounded-full disabled:cursor-not-allowed cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/admin/sig-members/${sig._id}`)}
                >
                  {sig.name}
                </button>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

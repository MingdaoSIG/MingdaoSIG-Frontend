"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NotFoundPage from "@/app/not-found";
import type { Sig } from "@/interfaces/Sig";
import sigAPI from "@/modules/sigAPI";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

export default function ManageAdvisorChooseSIG() {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();

  const [sigList, setSigList] = useState<Sig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigList();
        setSigList(response);
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
    <div className="h-[calc(100dvh-8rem)] w-full overflow-y-auto bg-gradient-to-br from-emerald-50 to-teal-50 px-4 pt-4 pb-4">
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
          <h1 className="font-bold text-gray-800 text-xl">選擇 SIG</h1>
          <div className="w-10"></div>
        </div>

        {/* Title Card */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">
              👨‍🏫
            </div>
            <div>
              <h2 className="font-bold text-lg">SIG 指導老師管理</h2>
              <p className="text-sm text-white/80">選擇要管理的 SIG</p>
            </div>
          </div>
        </div>

        {/* SIG Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-emerald-500 border-b-2"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sigList
              .filter((sig) => sig._id !== "663b09e19aa7c3d74577a786")
              .map((sig) => (
                <button
                  type="button"
                  key={sig._id}
                  onClick={() => router.push(`/admin/sig-advisor/${sig._id}`)}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-md transition-all duration-200 hover:shadow-lg"
                >
                  {sig.avatar ? (
                    <Image
                      src={sig.avatar}
                      alt={sig.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-xl">
                      {sig.name.charAt(0)}
                    </div>
                  )}
                  <span className="line-clamp-2 text-center font-medium text-gray-700 text-sm">
                    {sig.name}
                  </span>
                </button>
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
          className="mx-auto cursor-pointer rounded-full bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
        >
          ← 返回
        </button>
      </div>
      <div className="flex h-full flex-col items-center justify-start">
        <h1 className="mb-4 font-bold text-3xl">SIG 指導老師管理</h1>
        <p className="mb-4 text-xl">請選擇您要管理的 SIG:</p>
        <div className="grid grid-cols-3 gap-4">
          {sigList.map((sig) => {
            if (sig._id !== "663b09e19aa7c3d74577a786") {
              return (
                <button
                  type="button"
                  key={sig._id}
                  id={sig._id}
                  className="cursor-pointer rounded-full bg-white px-4 py-2 text-[#5fcdf5] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed"
                  onClick={() => router.push(`/admin/sig-advisor/${sig._id}`)}
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

"use client";

import { useUserAccount } from "@/utils/useUserAccount";
import NotFoundPage from "@/app/not-found";
import useIsMobile from "@/utils/useIsMobile";
import { useRouter } from "next/navigation";
import sigAPI from "@/modules/sigAPI";
import { useEffect, useState } from "react";

export default function ManageLeaderChooseSIG() {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();

  const [sigList, setSigList] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigList();
        setSigList(response);
      } catch (error: any) {
        console.error(error.message);
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
    <div className="flex flex-col justify-start w-screen h-screen pt-[4rem] pb-[4rem] px-2 relative overflow-y-auto">
      <div className="pt-[1rem] pb-[1rem]">
        <div className="w-full flex text-center mb-4">
          <button
            onClick={handleBack}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full mx-auto"
          >
            ← 返回
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">SIG Leader管理</h1>
          <p className="text-xl mb-4">請選擇您要管理的 SIG:</p>
          <div className="grid grid-cols-2 gap-4">
            {sigList.map((sig) => {
              if (sig._id !== "663b09e19aa7c3d74577a786") {
                return (
                  <button
                    key={sig._id}
                    id={sig._id}
                    className="bg-white text-[#5fcdf5] px-4 py-2 rounded-full disabled:cursor-not-allowed"
                    onClick={() => router.push(`/admin/sig-leader/${sig._id}`)}
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
    </div>
  ) : (
    <div className="pt-5 h-[calc(100%-6.5rem)] relative">
      <div className="w-full flex text-center mb-6">
        <button
          onClick={handleBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full mx-auto"
        >
          ← 返回
        </button>
      </div>
      <div className="flex flex-col items-center justify-start h-full">
        <h1 className="text-3xl font-bold mb-4">SIG Leader 管理</h1>
        <p className="text-xl mb-4">請選擇您要管理的 SIG:</p>
        <div className="grid grid-cols-3 gap-4">
          {sigList.map((sig) => {
            if (sig._id !== "663b09e19aa7c3d74577a786") {
              return (
                <button
                  key={sig._id}
                  id={sig._id}
                  className="bg-white text-[#5fcdf5] px-4 py-2 rounded-full disabled:cursor-not-allowed"
                  onClick={() => router.push(`/admin/sig-leader/${sig._id}`)}
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

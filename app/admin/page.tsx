"use client";

import { useUserAccount } from "@/utils/useUserAccount";
import NotFoundPage from "@/app/not-found";
import useIsMobile from "@/utils/useIsMobile";
import { useRouter } from "next/navigation";
import { menuConfig } from "./(admin)/config";

export default function AdminPage() {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();

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

  return isMobile ? (
    <div className="flex flex-col-reverse justify-start w-screen h-screen pt-16 pb-16 px-2 relative overflow-y-auto">
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-3xl font-bold mb-6">管理員頁面</h1>
        <p className="text-lg bg-red-200 rounded-lg p-4 mb-4 font-bold">請注意您目前是管理員身份登入系統，<br />這意味著您的操作都會直接或間接影響整個平台的運作，<br />請謹慎操作。</p>
        <p className="text-xl mb-4">請選擇您要管理的項目:</p>
        <div className="flex flex-col space-y-4">
          {
            menuConfig.map((item) => {
              return (
                <button
                  key={item.link}
                  className={`bg-white text-[#5fcdf5] px-4 py-2 rounded-full disabled:cursor-not-allowed ${item.disable ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => {
                    if (!item.disable) {
                      router.push(item.link);
                    }
                  }}
                  disabled={item.disable}
                >
                  {item.name}
                </button>
              );
            })}
        </div>
      </div>
    </div >
  ) : (
    <div className="pt-5 h-[calc(100%-6.5rem)]">
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-3xl font-bold mb-6">管理員頁面</h1>
        <p className="text-lg bg-red-200 rounded-lg p-4 mb-4 font-bold">請注意您目前是管理員身份登入系統，<br />這意味著您的操作都會直接或間接影響整個平台的運作，<br />請謹慎操作。</p>
        <p className="text-xl mb-4">請選擇您要管理的項目:</p>
        <div className="flex flex-col space-y-4">
          {
            menuConfig.map((item) => {
              return (
                <button
                  key={item.link}
                  className={`bg-white text-[#5fcdf5] px-4 py-2 rounded-full disabled:cursor-not-allowed ${item.disable ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => {
                    if (!item.disable) {
                      router.push(item.link);
                    }
                  }}
                  disabled={item.disable}
                >
                  {item.name}{item.disable ? " (開發中)" : ""}
                </button>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}
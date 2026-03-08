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
    return <div></div>;
  }

  if (userAccount.isLogin === false && userAccount.isLoading === false) {
    return <NotFoundPage />;
  }

  const userData = userAccount.userData;

  if (userData?.permission !== 2 && userAccount.isLoading === false) {
    return <NotFoundPage />;
  }

  return isMobile ? (
    <div className="w-full h-[calc(100dvh-8rem)] pt-4 px-4 pb-4 overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">管理員頁面</h1>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
        </div>

        {/* Warning Card */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <p className="text-sm text-amber-800 font-medium leading-relaxed">
                請注意您目前是管理員身份登入系統，這意味著您的操作都會直接或間接影響整個平台的運作，請謹慎操作。
              </p>
            </div>
          </div>
        </div>

        {/* Menu Title */}
        <p className="text-gray-600 text-center mb-4 font-medium">請選擇您要管理的項目</p>

        {/* Menu Buttons */}
        <div className="space-y-3">
          {menuConfig.map((item) => (
            <button
              key={item.link}
              onClick={() => !item.disable && router.push(item.link)}
              disabled={item.disable}
              className={`
                w-full py-4 px-6 rounded-xl font-medium text-left transition-all duration-200 flex items-center justify-between
                ${item.disable 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer border border-gray-100"
                }
              `}
            >
              <span className="flex items-center gap-3">
                <span className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-lg
                  ${item.disable ? "bg-gray-200" : "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"}
                `}>
                  {item.name.includes("Leader") && "👑"}
                  {item.name.includes("指導") && "👨‍🏫"}
                  {item.name.includes("成員") && "👥"}
                  {item.name.includes("貼文") && "📝"}
                  {item.name.includes("查詢") && "🔍"}
                </span>
                <span className="font-semibold">{item.name}</span>
              </span>
              {!item.disable && (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {item.disable && (
                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full">開發中</span>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>MDSIG Admin Panel v2.0</p>
        </div>
      </div>
    </div>
  ) : (
    <div className="pt-5 h-[calc(100%-6.5rem)]">
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-3xl font-bold mb-6">管理員頁面</h1>
        <p className="text-lg bg-red-200 rounded-lg p-4 mb-4 font-bold">
          請注意您目前是管理員身份登入系統，
          <br />
          這意味著您的操作都會直接或間接影響整個平台的運作，
          <br />
          請謹慎操作。
        </p>
        <p className="text-xl mb-4">請選擇您要管理的項目:</p>
        <div className="flex flex-col space-y-4">
          {menuConfig.map((item) => {
            return (
              <button
                key={item.link}
                className={`bg-white text-[#5fcdf5] px-4 py-2 rounded-full cursor-pointer hover:bg-gray-50 transition-colors disabled:cursor-not-allowed ${item.disable ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => {
                  if (!item.disable) {
                    router.push(item.link);
                  }
                }}
                disabled={item.disable}
              >
                {item.name}
                {item.disable ? " (開發中)" : ""}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

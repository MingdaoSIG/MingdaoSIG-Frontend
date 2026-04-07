"use client";

import { useRouter } from "next/navigation";
import NotFoundPage from "@/app/not-found";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
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
    <div className="h-[calc(100dvh-8rem)] w-full overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-50 px-4 pt-4 pb-4">
      <div className="mx-auto max-w-md">
        {/* Header Card */}
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <h1 className="mb-2 text-center font-bold text-2xl text-gray-800">
            管理員頁面
          </h1>
          <div className="mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        </div>

        {/* Warning Card */}
        <div className="mb-6 rounded-xl border-amber-500 border-l-4 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <p className="font-medium text-amber-800 text-sm leading-relaxed">
                請注意您目前是管理員身份登入系統，這意味著您的操作都會直接或間接影響整個平台的運作，請謹慎操作。
              </p>
            </div>
          </div>
        </div>

        {/* Menu Title */}
        <p className="mb-4 text-center font-medium text-gray-600">
          請選擇您要管理的項目
        </p>

        {/* Menu Buttons */}
        <div className="space-y-3">
          {menuConfig.map((item) => (
            <button
              type="button"
              key={item.link}
              onClick={() => !item.disable && router.push(item.link)}
              disabled={item.disable}
              className={`flex w-full items-center justify-between rounded-xl px-6 py-4 text-left font-medium transition-all duration-200 ${
                item.disable
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "cursor-pointer border border-gray-100 bg-white text-gray-700 shadow-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg"
              }
              `}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${item.disable ? "bg-gray-200" : "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"}
                `}
                >
                  {item.name.includes("Leader") && "👑"}
                  {item.name.includes("指導") && "👨‍🏫"}
                  {item.name.includes("成員") && "👥"}
                  {item.name.includes("貼文") && "📝"}
                  {item.name.includes("查詢") && "🔍"}
                </span>
                <span className="font-semibold">{item.name}</span>
              </span>
              {!item.disable && (
                <svg
                  aria-hidden="true"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {item.disable && (
                <span className="rounded-full bg-gray-200 px-2 py-1 text-gray-500 text-xs">
                  開發中
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>MDSIG Admin Panel v2.0</p>
        </div>
      </div>
    </div>
  ) : (
    <div className="h-[calc(100%-6.5rem)] pt-5">
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="mb-6 font-bold text-3xl">管理員頁面</h1>
        <p className="mb-4 rounded-lg bg-red-200 p-4 font-bold text-lg">
          請注意您目前是管理員身份登入系統，
          <br />
          這意味著您的操作都會直接或間接影響整個平台的運作，
          <br />
          請謹慎操作。
        </p>
        <p className="mb-4 text-xl">請選擇您要管理的項目:</p>
        <div className="flex flex-col space-y-4">
          {menuConfig.map((item) => {
            return (
              <button
                type="button"
                key={item.link}
                className={`cursor-pointer rounded-full bg-white px-4 py-2 text-[#5fcdf5] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed ${item.disable ? "cursor-not-allowed opacity-50" : ""}`}
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

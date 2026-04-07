"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as XLSX from "xlsx";
import NotFoundPage from "@/app/not-found";
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
import sigAPI from "@/modules/sigAPI";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

export default function Page() {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(TThread & { userName: string })[]>(
    [],
  );
  const userAccount = useUserAccount();
  const isMobile = useIsMobile();
  const router = useRouter();

  if (userAccount.isLoading === true) {
    return <div></div>;
  }
  if (userAccount.isLogin === false) {
    return <NotFoundPage />;
  }
  if (userAccount.userData?.permission !== 2) {
    return <NotFoundPage />;
  }

  const formatDateTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "";

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("start", startDate);
      params.set("end", endDate);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/post/list/range?${params.toString()}`;
      const res = await fetch(url);
      const json = await res.json();
      const data = json.data || [];
      const users: User[] = await Promise.all(
        data.map((d: TThread) => sigAPI.getUserData(d.user)),
      );
      const userMap = users.reduce<Record<string, string>>((acc, user) => {
        if (user?._id && user?.name) {
          acc[user._id] = user.name;
        }
        return acc;
      }, {});
      setResults(
        data.map((d: TThread) => ({
          ...d,
          userName: userMap[d.user] || "未知",
        })),
      );
    } catch (_e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.push("/admin");

  const downloadXLSX = () => {
    if (results.length === 0) {
      return;
    }
    const data = results.map((r) => ({
      ID: r._id,
      標題: r.title,
      發文日期: r.createdAt
        ? new Date(r.createdAt).toLocaleString("zh-TW")
        : "",
      發文者: r.userName,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "貼文紀錄");
    XLSX.writeFile(wb, `貼文紀錄 (${startDate} ~ ${endDate}).xlsx`);
  };

  if (isMobile) {
    return (
      <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-cyan-50 to-blue-50 px-4 pt-4 pb-20">
        <div className="mx-auto max-w-md">
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-gray-600 shadow-md transition-colors hover:bg-gray-50"
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
            <div>
              <h1 className="font-bold text-gray-800 text-xl">區間貼文查詢</h1>
              <p className="text-gray-500 text-xs">查詢特定時間範圍的貼文</p>
            </div>
          </div>

          {/* Filter Card */}
          <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-md">
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="mobile-start-date"
                  className="mb-1 block font-medium text-gray-600 text-xs"
                >
                  開始日期
                </label>
                <input
                  id="mobile-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label
                  htmlFor="mobile-end-date"
                  className="mb-1 block font-medium text-gray-600 text-xs"
                >
                  結束日期
                </label>
                <input
                  id="mobile-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchPosts}
                disabled={loading}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 py-2.5 font-medium text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
                {loading ? "查詢中..." : "查詢"}
              </button>
              {results.length > 0 && (
                <button
                  type="button"
                  onClick={downloadXLSX}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2.5 font-medium text-white shadow-md transition-all hover:shadow-lg"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Results Card */}
          <div
            className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md"
            style={{ height: "calc(100vh - 320px)", minHeight: "300px" }}
          >
            <div className="h-full overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                  <tr>
                    <th className="w-[20%] px-2 py-3 text-center font-semibold text-xs">
                      ID
                    </th>
                    <th className="w-[45%] px-2 py-3 text-left font-semibold text-xs">
                      標題
                    </th>
                    <th className="w-[15%] px-2 py-3 text-center font-semibold text-xs">
                      作者
                    </th>
                    <th className="w-[20%] px-2 py-3 text-center font-semibold text-xs">
                      時間
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                          📝
                        </div>
                        <p className="text-gray-500 text-sm">暫無資料</p>
                        <p className="mt-1 text-gray-400 text-xs">
                          請選擇日期範圍後查詢
                        </p>
                      </td>
                    </tr>
                  ) : (
                    results.map((r, i) => (
                      <tr
                        key={r._id}
                        className={i % 2 === 0 ? "bg-gray-50/50" : "bg-white"}
                      >
                        <td className="px-2 py-3 text-center">
                          <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-cyan-700 text-xs">
                            {r._id?.slice(-6) || "N/A"}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <div
                            className="max-w-[150px] truncate"
                            title={r.title}
                          >
                            {r.title}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center text-gray-600">
                          {r.userName}
                        </td>
                        <td className="px-2 py-3 text-center text-gray-500 text-xs">
                          {formatDateTime(r.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Result Count */}
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm">
            找到 <strong className="text-cyan-600">{results.length}</strong>{" "}
            筆資料
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100%-2rem)] w-full flex-col overflow-hidden px-4 pt-4">
      <h1 className="mb-2 flex-shrink-0 text-center font-bold text-2xl text-gray-800">
        區間資料查詢
      </h1>
      <div className="mb-2 flex flex-shrink-0 justify-center gap-4">
        <div>
          <label
            htmlFor="desktop-start-date"
            className="font-medium text-gray-700 text-sm"
          >
            開始日期
          </label>
          <input
            id="desktop-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block rounded-lg border border-gray-300 px-3 py-1.5 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="desktop-end-date"
            className="font-medium text-gray-700 text-sm"
          >
            結束日期
          </label>
          <input
            id="desktop-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block rounded-lg border border-gray-300 px-3 py-1.5 focus:outline-none"
          />
        </div>
      </div>
      <div className="mb-2 flex-shrink-0 text-center">
        <button
          type="button"
          onClick={fetchPosts}
          disabled={loading}
          className="cursor-pointer rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {loading ? "查詢中..." : "查詢"}
        </button>
        {results.length > 0 && (
          <button
            type="button"
            onClick={downloadXLSX}
            className="ml-2 cursor-pointer rounded-lg bg-green-500 px-6 py-2 text-white transition-colors hover:bg-green-600"
          >
            下載 XLSX
          </button>
        )}
      </div>
      <div className="mx-auto w-full max-w-5xl flex-1 overflow-hidden rounded-lg border border-gray-200 shadow-lg">
        <div className="h-full overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="w-[20%] px-2 py-3 text-center font-semibold">
                  ID
                </th>
                <th className="w-[58%] px-2 py-3 text-center font-semibold">
                  標題
                </th>
                <th className="w-[10%] px-2 py-3 text-center font-semibold">
                  作者
                </th>
                <th className="w-[12%] px-2 py-3 text-center font-semibold">
                  建立時間
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    暫無資料
                  </td>
                </tr>
              ) : (
                results.map((r, i) => (
                  <tr
                    key={r._id}
                    className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="px-2 py-3 text-center">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800 text-xs">
                        {r._id || "N/A"}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">{r.title}</td>
                    <td className="px-2 py-3 text-center">{r.userName}</td>
                    <td className="px-2 py-3 text-center text-gray-500">
                      {formatDateTime(r.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mx-auto mt-2 w-full max-w-5xl flex-shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-6 py-3 text-center">
        找到：<strong className="text-blue-600">{results.length}</strong> 筆資料
      </div>
    </div>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as XLSX from "xlsx";
import NotFoundPage from "@/app/not-found";
import type { TThread } from "@/interfaces/Thread";
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

  if (userAccount.isLoading === true) return <div></div>;
  if (userAccount.isLogin === false) return <NotFoundPage />;
  if (userAccount.userData?.permission !== 2) return <NotFoundPage />;

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
      const users = await Promise.all(
        data.map((d: any) => sigAPI.getUserData(d.user)),
      );
      const userMap = users.reduce((acc: any, user: any) => {
        if (user) acc[user._id] = user.name;
        return acc;
      }, {});
      setResults(
        data.map((d: any) => ({ ...d, userName: userMap[d.user] || "未知" })),
      );
    } catch (_e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.push("/admin");

  const downloadXLSX = () => {
    if (results.length === 0) return;
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
      <div className="w-full h-full pt-4 px-4 pb-20 overflow-y-auto bg-gradient-to-br from-cyan-50 to-blue-50">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBack}
              className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors flex-shrink-0"
            >
              <svg
                className="w-5 h-5"
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
              <h1 className="text-xl font-bold text-gray-800">區間貼文查詢</h1>
              <p className="text-xs text-gray-500">查詢特定時間範圍的貼文</p>
            </div>
          </div>

          {/* Filter Card */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4 border border-gray-100">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  開始日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  結束日期
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchPosts}
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-4 h-4"
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
                  onClick={downloadXLSX}
                  className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
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
            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
            style={{ height: "calc(100vh - 320px)", minHeight: "300px" }}
          >
            <div className="overflow-auto h-full">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white sticky top-0">
                  <tr>
                    <th className="py-3 px-2 w-[20%] text-center font-semibold text-xs">
                      ID
                    </th>
                    <th className="py-3 px-2 w-[45%] text-left font-semibold text-xs">
                      標題
                    </th>
                    <th className="py-3 px-2 w-[15%] text-center font-semibold text-xs">
                      作者
                    </th>
                    <th className="py-3 px-2 w-[20%] text-center font-semibold text-xs">
                      時間
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                          📝
                        </div>
                        <p className="text-gray-500 text-sm">暫無資料</p>
                        <p className="text-xs text-gray-400 mt-1">
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
                        <td className="py-3 px-2 text-center">
                          <span className="text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded">
                            {r._id?.slice(-6) || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div
                            className="truncate max-w-[150px]"
                            title={r.title}
                          >
                            {r.title}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600">
                          {r.userName}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-500 text-xs">
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
          <div className="bg-gray-50 px-4 py-3 text-center text-sm rounded-xl border border-gray-200 mt-3">
            找到 <strong className="text-cyan-600">{results.length}</strong>{" "}
            筆資料
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100%-2rem)] pt-4 px-4 overflow-hidden flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2 flex-shrink-0">
        區間資料查詢
      </h1>
      <div className="flex-shrink-0 flex justify-center gap-4 mb-2">
        <div>
          <label className="text-sm font-medium text-gray-700">開始日期</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">結束日期</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-shrink-0 text-center mb-2">
        <button
          onClick={fetchPosts}
          disabled={loading}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "查詢中..." : "查詢"}
        </button>
        {results.length > 0 && (
          <button
            onClick={downloadXLSX}
            className="ml-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg cursor-pointer transition-colors"
          >
            下載 XLSX
          </button>
        )}
      </div>
      <div className="flex-1 overflow-hidden rounded-lg shadow-lg border border-gray-200 max-w-5xl mx-auto w-full">
        <div className="overflow-auto h-full">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0">
              <tr>
                <th className="py-3 px-2 w-[20%] text-center font-semibold">
                  ID
                </th>
                <th className="py-3 px-2 w-[58%] text-center font-semibold">
                  標題
                </th>
                <th className="py-3 px-2 w-[10%] text-center font-semibold">
                  作者
                </th>
                <th className="py-3 px-2 w-[12%] text-center font-semibold">
                  建立時間
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    暫無資料
                  </td>
                </tr>
              ) : (
                results.map((r, i) => (
                  <tr
                    key={r._id}
                    className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="py-3 px-2 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        {r._id || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">{r.title}</td>
                    <td className="py-3 px-2 text-center">{r.userName}</td>
                    <td className="py-3 px-2 text-center text-gray-500">
                      {formatDateTime(r.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex-shrink-0 bg-gray-50 px-6 py-3 text-center mt-2 rounded-lg border border-gray-200 max-w-5xl mx-auto w-full">
        找到：<strong className="text-blue-600">{results.length}</strong> 筆資料
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { useUserAccount } from "@/utils/useUserAccount";
import NotFoundPage from "@/app/not-found";
import useIsMobile from "@/utils/useIsMobile";
import { useRouter } from "next/navigation";
import sigAPI from "@/modules/sigAPI";
import { TThread } from "@/interfaces/Thread";
import * as XLSX from "xlsx";


export default function Page() {
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<(TThread & { userName: string })[]>([]);
  const userAccount = useUserAccount();
  const isMobile = useIsMobile();
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

  const validateRange = (): string | null => {
    if (startDate && endDate && startDate > endDate) {
      return "開始日期不得晚於結束日期。";
    }
    return null;
  };

  const formatDateTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }) : "";

  const fetchPosts = async () => {
    setError(null);
    const vErr = validateRange();
    if (vErr) {
      setError(vErr);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);

      const url = `${process.env.NEXT_PUBLIC_API_URL}/post/list/range?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`fetch failed: ${res.status}`);
      }

      const json = await res.json();
      const data = json.data as (TThread & { userName: string })[] || [];
      setResults(data);
      // set userName
      const users = await Promise.all(data.map(d => sigAPI.getUserData(d.user)));
      const userMap = users.reduce((acc, user) => {
        if (user) acc[user._id] = user.name;
        return acc;
      }, {} as Record<string, string>);
      setResults(data.map(d => ({
        ...d,
        userName: userMap[d.user] || "未知使用者",
      })));
    } catch (e) {
      setError(
        "無法連線到後端，已顯示範例資料。請確認 API 可用。"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/admin");
  };

  const downloadXLSX = () => {
    if (results.length === 0) return;

    // 準備數據
    const data = results.map(r => ({
      "ID": r._id,
      "標題": r.title,
      "發文日期": r.createdAt ? new Date(r.createdAt).toLocaleString("zh-TW") : "",
      "發文者": r.userName
    }));

    // 創建工作簿和工作表
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "貼文紀錄");

    // 設置列寬（可選）
    const colWidths = [
      { wch: 25 }, // ID
      { wch: 40 }, // 標題
      { wch: 20 }, // 發文日期
      { wch: 15 }, // 發文者
    ];
    ws["!cols"] = colWidths;

    // 下載文件
    XLSX.writeFile(wb, `貼文紀錄 (${startDate} ~ ${endDate}).xlsx`);
  };

  return (
    (!isMobile) ? (
      <div className="pt-5 h-[calc(100%-6.5rem)] relative">
        <div className="flex flex-col items-center justify-start h-full">
          <h1 className="text-3xl font-bold text-gray-800">區間資料查詢</h1>

          <div className="w-full max-w-4xl rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  開始日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-0"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  結束日期
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="text-center flex gap-2">
              <button
                onClick={fetchPosts}
                disabled={loading}
                className="inline-flex px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "查詢中..." : "查詢"}
              </button>
              {results.length > 0 && (
                <button
                  onClick={downloadXLSX}
                  className="inline-flex px-6 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-0"
                >
                  下載 XLSX
                </button>
              )}
            </div>


            <div className="rounded-lg h-full overflow-hidden mt-4">
              <table className="min-w-full bg-white rounded-lg">
                <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0 z-10">
                  <tr className="text-center flex">
                    <th className="py-4 text-center text-sm font-semibold uppercase tracking-wider w-3/12">
                      ID
                    </th>
                    <th className="py-4 text-center text-sm font-semibold uppercase tracking-wider w-6/12">
                      標題
                    </th>
                    <th className="py-4 text-center text-sm font-semibold uppercase tracking-wider w-1/12">
                      作者
                    </th>
                    <th className="py-4 text-center text-sm font-semibold uppercase tracking-wider w-2/12">
                      建立時間
                    </th>
                  </tr>
                </thead>
              </table>

              <div className="overflow-y-auto max-h-96 remove-scrollbar w-full">
                <table className="min-w-full bg-white">
                  <tbody className="divide-y divide-gray-200">
                    {(results.length === 0 && !loading) ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          暫無資料
                        </td>
                      </tr>
                    ) : (
                      <>
                        {results?.map((r, index) => {
                          return (
                            <tr
                              key={r._id}
                              className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} flex hover:bg-blue-50 transition-colors duration-200 text-center`}
                            >
                              <td className="py-4 text-sm font-medium text-gray-900 text-center w-3/12">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {r._id}
                                </span>
                              </td>
                              <td className="py-4 text-sm text-gray-900 text-center w-6/12 truncate">{r.title}</td>
                              <td className="py-4 text-sm text-gray-900 text-center w-1/12">{r.userName}</td>
                              <td className="py-4 text-sm text-gray-500 text-center w-2/12">{formatDateTime(r.createdAt)}</td>
                            </tr>
                          );
                        })}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Results Count */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  找到：<strong className="text-blue-600">{results.length}</strong> 筆資料
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col justify-start w-screen h-[100dvh] pt-[4rem] pb-[4rem] px-2 relative overflow-y-auto">
        <div className="pt-[1rem] pb-[1rem]">
          <div className="w-full flex text-center mb-4">
            <button
              onClick={handleBack}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full mx-auto"
            >
              ← 返回
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">區間貼文查詢</h1>
          <div className="w-full max-w-4xl rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  開始日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-0"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  結束日期
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="text-center flex gap-2 items-center justify-center">
              <button
                onClick={fetchPosts}
                disabled={loading}
                className="inline-flex px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "查詢中..." : "查詢"}
              </button>
              {results.length > 0 && (
                <button
                  onClick={downloadXLSX}
                  className="inline-flex px-6 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-0"
                >
                  下載 XLSX
                </button>
              )}
            </div>


            <div className="rounded-lg overflow-hidden mt-4 max-h-[52dvh]">
              <div className="overflow-y-auto max-h-96 bg-gray-50">
                {(results.length === 0 && !loading) ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-4">📝</div>
                    <p>暫無資料</p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {results?.map((r, index) => (
                      <div
                        key={r._id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
                      >
                        {/* ID 標籤 */}
                        <div className="flex justify-between items-start mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ID: {r._id}
                          </span>
                        </div>

                        {/* 標題 */}
                        <div className="mb-3">
                          <h3 className="text-sm font-medium text-gray-900 leading-5">
                            {r.title}
                          </h3>
                        </div>

                        {/* 作者和時間 */}
                        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">{r.userName}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>{formatDateTime(r.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  找到：<strong className="text-blue-600">{results.length}</strong> 筆資料
                </p>
              </div>
            </div>
          </div >
        </div >
      </div >
    )
  );
}

/* --- helpers --- */
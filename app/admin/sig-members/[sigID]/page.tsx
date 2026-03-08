"use client";

import { useUserAccount } from "@/utils/useUserAccount";
import NotFoundPage from "@/app/not-found";
import useIsMobile from "@/utils/useIsMobile";
import { useRouter } from "next/navigation";
import sigAPI from "@/modules/sigAPI";
import { useEffect, useState, useCallback, use } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

interface Member {
  _id: string;
  code: string;
  name: string;
  email: string;
  class?: string;
  sig?: string[];
  avatar?: string;
}

export default function ManageSIGMembers({
  params,
}: {
  params: Promise<{ sigID: string }>;
}) {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();
  const { sigID } = use(params);

  const [sigData, setSigData] = useState<any>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userAccount.token) return;
    try {
      setIsLoading(true);
      const sigResponse = await sigAPI.getSigData(sigID);
      setSigData(sigResponse);
      const membersResponse = await sigAPI.getSigMembers(sigID, userAccount.token);
      if (membersResponse && Array.isArray(membersResponse)) {
        setMembers(membersResponse.map((m: any) => ({
          _id: m._id,
          code: m.code || "",
          name: m.name || "",
          email: m.email || "",
          class: m.class || "",
          sig: m.sig || [],
          avatar: m.avatar || "",
        })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [sigID, userAccount.token]);

  function downloadXLSX() {
    if (members.length === 0) {
      Swal.fire({
        title: "無法下載",
        text: "沒有成員資料可以下載",
        icon: "warning",
        confirmButtonText: "確定",
        confirmButtonColor: "#5fcdf5",
      });
      return;
    }
    const data = members.map((m) => ({ 學號: m.code, 姓名: m.name, Email: m.email, 班級: m.class || "" }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "成員名單");
    ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 10 }];
    XLSX.writeFile(wb, `${sigData.name || "SIG"}_成員名單_${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (userAccount.isLoading) return <div></div>;
  if (!userAccount.isLogin) return <NotFoundPage />;
  if (userAccount.userData?.permission !== 2) return <NotFoundPage />;

  const handleBack = () => router.push("/admin/sig-members");

  return isMobile ? (
    <div className="w-full h-full pt-4 px-4 pb-20 overflow-y-auto bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800 truncate">{sigData.name}</h1>
            <p className="text-xs text-gray-500">成員名單</p>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">目前成員數量</p>
              <p className="text-2xl font-bold text-green-600">{members.length}</p>
            </div>
            <button
              onClick={downloadXLSX}
              disabled={members.length === 0 || isLoading}
              className="bg-gradient-to-r from-green-500 to-emerald-500 disabled:from-gray-300 disabled:to-gray-300 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              下載
            </button>
          </div>
        </div>

        {/* Members List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">👥</div>
            <p className="text-gray-500">暫無成員資料</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => (
              <div key={member._id} className={`rounded-xl shadow-md p-4 border border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-green-50/50"}`}>
                <div className="flex items-center gap-3">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-green-100"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-lg font-bold text-green-600">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.code}</p>
                    <p className="text-xs text-gray-400 truncate">{member.email}</p>
                  </div>
                  {member.class && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
                      {member.class}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="w-full h-[calc(100%-2rem)] pt-4 px-4 overflow-hidden flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2 flex-shrink-0">{sigData.name} 成員名單</h1>
      <div className="flex-shrink-0 text-center mb-2">
        <button
          onClick={downloadXLSX}
          disabled={members.length === 0 || isLoading}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          下載 XLSX
        </button>
        <button onClick={handleBack} className="ml-2 px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors">
          ← 返回
        </button>
      </div>
      <div className="flex-1 overflow-hidden rounded-lg shadow-lg border border-gray-200 max-w-5xl mx-auto w-full">
        <div className="overflow-auto h-full">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0">
              <tr>
                <th className="py-3 px-2 w-[20%] text-center font-semibold">學號</th>
                <th className="py-3 px-2 w-[20%] text-center font-semibold">姓名</th>
                <th className="py-3 px-2 w-[45%] text-center font-semibold">Email</th>
                <th className="py-3 px-2 w-[15%] text-center font-semibold">班級</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8"><div className="animate-spin h-8 w-8 border-b-2 border-green-500 mx-auto"></div></td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">暫無成員資料</td></tr>
              ) : (
                members.map((m, i) => (
                  <tr key={m._id} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="py-3 px-2 text-center"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">{m.code}</span></td>
                    <td className="py-3 px-2 text-center">{m.name}</td>
                    <td className="py-3 px-2 truncate max-w-0"><div className="truncate" title={m.email}>{m.email}</div></td>
                    <td className="py-3 px-2 text-center text-gray-500">{m.class || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex-shrink-0 bg-gray-50 px-6 py-3 text-center mt-2 rounded-lg border border-gray-200 max-w-5xl mx-auto w-full">
        成員數量：<strong className="text-blue-600">{isLoading ? "載入中..." : members.length}</strong> 人
      </div>
    </div>
  );
}

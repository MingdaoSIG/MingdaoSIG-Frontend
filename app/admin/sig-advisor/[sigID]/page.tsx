"use client";

import { useUserAccount } from "@/utils/useUserAccount";
import NotFoundPage from "@/app/not-found";
import useIsMobile from "@/utils/useIsMobile";
import { useRouter } from "next/navigation";
import sigAPI from "@/modules/sigAPI";
import { useEffect, useState, useCallback, use } from "react";
import Swal from "sweetalert2";

export default function ManageSIGAdvisor({
  params,
}: {
  params: Promise<{ sigID: string }>;
}) {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();
  const { sigID } = use(params);

  const [sigData, setSigData] = useState<any>({});
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdvisors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sigAPI.getSigData(sigID);
      setSigData(response);

      if (response.moderator && response.moderator.length > 0) {
        const addedAdvisorIds = new Set();
        const advisorsData = [];

        for (const advisorId of response.moderator) {
          if (addedAdvisorIds.has(advisorId)) continue;
          try {
            const res = await sigAPI.getUserData(advisorId);
            if (res) {
              addedAdvisorIds.add(advisorId);
              advisorsData.push(res);
            }
          } catch (error) {
            console.error(`Error fetching advisor ${advisorId}:`, error);
          }
        }
        setAdvisors(advisorsData);
      } else {
        setAdvisors([]);
      }
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [sigID]);

  function addAdvisor() {
    Swal.fire({
      title: "新增指導老師",
      input: "text",
      inputLabel: "請輸入要新增的指導老師電子郵件",
      inputPlaceholder: "例如: teacher@school.edu.tw",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return "請輸入電子郵件!";
      },
      confirmButtonText: "新增",
      cancelButtonText: "取消",
      confirmButtonColor: "#5fcdf5",
      customClass: {
        title: "text-lg font-bold",
        popup: "rounded-lg",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const code = result.value;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/${sigID}/moderator`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${userAccount.token}`,
          },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (res.status === 200) {
          Swal.fire({
            title: "新增成功!",
            text: "成功新增指導老師!",
            icon: "success",
            confirmButtonColor: "#5fcdf5",
          });
          fetchAdvisors();
        } else if (data.status === 4033) {
          Swal.fire({ title: "新增失敗!", text: "該電子郵件已經是指導老師!", icon: "error" });
        } else if (data.status === 4017) {
          Swal.fire({ title: "新增失敗!", text: "該電子郵件尚未註冊 SIG 帳號!", icon: "error" });
        } else {
          Swal.fire({ title: "新增失敗!", text: "請聯絡開發者！", icon: "error" });
        }
      }
    });
  }

  function deleteAdvisor(advisorId: string) {
    Swal.fire({
      title: "確定要刪除這位指導老師嗎?",
      text: "刪除後就必須重新新增，請謹慎操作!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/${sigID}/moderator`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${userAccount.token}`,
          },
          body: JSON.stringify({ moderatorId: advisorId }),
        });
        if (res.status === 200) {
          Swal.fire({ title: "刪除成功!", text: "成功刪除指導老師!", icon: "success", confirmButtonColor: "#5fcdf5" });
          fetchAdvisors();
        } else {
          Swal.fire({ title: "刪除失敗!", text: "請聯絡開發者！", icon: "error" });
        }
      }
    });
  }

  useEffect(() => {
    fetchAdvisors();
  }, [fetchAdvisors]);

  if (userAccount.isLoading === true) return <div></div>;
  if (userAccount.isLogin === false) return <NotFoundPage />;
  if (userAccount.userData?.permission !== 2) return <NotFoundPage />;

  const handleBack = () => router.push("/admin/sig-advisor");

  return isMobile ? (
    <div className="w-full h-full pt-4 px-4 pb-20 overflow-y-auto bg-gradient-to-br from-emerald-50 to-teal-50">
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
            <p className="text-xs text-gray-500">指導老師管理</p>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">目前指導老師數量</p>
              <p className="text-2xl font-bold text-emerald-600">{advisors.length}</p>
            </div>
            <button
              onClick={addAdvisor}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增
            </button>
          </div>
        </div>

        {/* Advisors List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          </div>
        ) : advisors.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">👨‍🏫</div>
            <p className="text-gray-500">暫無指導老師</p>
            <p className="text-sm text-gray-400 mt-1">點擊上方按鈕新增</p>
          </div>
        ) : (
          <div className="space-y-3">
            {advisors.map((advisor) => (
              <div key={advisor._id} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {advisor.avatar ? (
                      <img
                        src={advisor.avatar}
                        alt={advisor.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-emerald-100"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center text-lg font-bold text-emerald-600">
                        {advisor.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">{advisor.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">{advisor.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAdvisor(advisor._id)}
                    className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 cursor-pointer transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="pt-5 h-[calc(100%-6.5rem)] relative">
      <div className="w-full flex text-center mb-6">
        <button onClick={handleBack} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full mx-auto cursor-pointer transition-colors">
          ← 返回
        </button>
      </div>
      <div className="flex flex-col items-center justify-start h-full">
        <h1 className="text-3xl font-bold mb-4">
          <span className="text-red-500">{sigData.name}</span> 指導老師管理
        </h1>
        <button onClick={addAdvisor} className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-full mx-auto mb-2 cursor-pointer transition-colors">
          新增指導老師
        </button>
        <p className="text-xl mb-4">指導老師列表：</p>
        <div className="flex flex-col w-full max-w-5xl mx-auto rounded-lg overflow-hidden shadow-lg border border-gray-200">
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-center font-semibold">姓名</th>
                  <th className="px-6 py-3 text-center font-semibold">Email</th>
                  <th className="px-6 py-3 text-center font-semibold">動作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {advisors.map((advisor) => (
                  <tr key={advisor._id} className="bg-white">
                    <td className="px-6 py-4 text-center">{advisor.name}</td>
                    <td className="px-6 py-4 text-center">{advisor.email}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        className="bg-red-500 hover:bg-red-700 text-white py-1.5 px-3 rounded-full cursor-pointer transition-colors"
                        onClick={() => deleteAdvisor(advisor._id)}
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

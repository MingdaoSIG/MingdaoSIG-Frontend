"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import NotFoundPage from "@/app/not-found";
import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import sigAPI from "@/modules/sigAPI";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

export default function ManageSIGAdvisor({
  params,
}: {
  params: Promise<{ sigID: string }>;
}) {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();
  const { sigID } = use(params);

  const [sigData, setSigData] = useState<Sig | null>(null);
  const [advisors, setAdvisors] = useState<User[]>([]);
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
          if (addedAdvisorIds.has(advisorId)) {
            continue;
          }
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
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
        if (!value) {
          return "請輸入電子郵件!";
        }
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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/sig/${sigID}/moderator`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${userAccount.token}`,
            },
            body: JSON.stringify({ code }),
          },
        );
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
          Swal.fire({
            title: "新增失敗!",
            text: "該電子郵件已經是指導老師!",
            icon: "error",
          });
        } else if (data.status === 4017) {
          Swal.fire({
            title: "新增失敗!",
            text: "該電子郵件尚未註冊 SIG 帳號!",
            icon: "error",
          });
        } else {
          Swal.fire({
            title: "新增失敗!",
            text: "請聯絡開發者！",
            icon: "error",
          });
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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/sig/${sigID}/moderator`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${userAccount.token}`,
            },
            body: JSON.stringify({ moderatorId: advisorId }),
          },
        );
        if (res.status === 200) {
          Swal.fire({
            title: "刪除成功!",
            text: "成功刪除指導老師!",
            icon: "success",
            confirmButtonColor: "#5fcdf5",
          });
          fetchAdvisors();
        } else {
          Swal.fire({
            title: "刪除失敗!",
            text: "請聯絡開發者！",
            icon: "error",
          });
        }
      }
    });
  }

  useEffect(() => {
    fetchAdvisors();
  }, [fetchAdvisors]);

  if (userAccount.isLoading === true) {
    return <div></div>;
  }
  if (userAccount.isLogin === false) {
    return <NotFoundPage />;
  }
  if (userAccount.userData?.permission !== 2) {
    return <NotFoundPage />;
  }

  const handleBack = () => router.push("/admin/sig-advisor");

  return isMobile ? (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-emerald-50 to-teal-50 px-4 pt-4 pb-20">
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
          <div className="flex-1">
            <h1 className="truncate font-bold text-gray-800 text-lg">
              {sigData?.name}
            </h1>
            <p className="text-gray-500 text-xs">指導老師管理</p>
          </div>
        </div>

        {/* Action Card */}
        <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">目前指導老師數量</p>
              <p className="font-bold text-2xl text-emerald-600">
                {advisors.length}
              </p>
            </div>
            <button
              type="button"
              onClick={addAdvisor}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-white shadow-md transition-all hover:shadow-lg"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              新增
            </button>
          </div>
        </div>

        {/* Advisors List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-emerald-500 border-b-2"></div>
          </div>
        ) : advisors.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-3xl">
              👨‍🏫
            </div>
            <p className="text-gray-500">暫無指導老師</p>
            <p className="mt-1 text-gray-400 text-sm">點擊上方按鈕新增</p>
          </div>
        ) : (
          <div className="space-y-3">
            {advisors.map((advisor) => (
              <div
                key={advisor._id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {advisor.avatar ? (
                      <Image
                        src={advisor.avatar}
                        alt={advisor.name ?? ""}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full border-2 border-emerald-100 object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 font-bold text-emerald-600 text-lg">
                        {advisor.name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">
                        {advisor.name}
                      </p>
                      <p className="max-w-[150px] truncate text-gray-400 text-xs">
                        {advisor.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAdvisor(advisor._id ?? "")}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
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
        <h1 className="mb-4 font-bold text-3xl">
          <span className="text-red-500">{sigData?.name}</span> 指導老師管理
        </h1>
        <button
          type="button"
          onClick={addAdvisor}
          className="mx-auto mb-2 cursor-pointer rounded-full bg-white px-4 py-2 text-black transition-colors hover:bg-gray-100"
        >
          新增指導老師
        </button>
        <p className="mb-4 text-xl">指導老師列表：</p>
        <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-gray-200 shadow-lg">
          <div className="max-h-96 overflow-auto">
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
                        type="button"
                        className="cursor-pointer rounded-full bg-red-500 px-3 py-1.5 text-white transition-colors hover:bg-red-700"
                        onClick={() => deleteAdvisor(advisor._id ?? "")}
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

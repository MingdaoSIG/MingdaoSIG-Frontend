"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import NotFoundPage from "@/app/not-found";
import type { Sig } from "@/interfaces/Sig";
import sigAPI from "@/modules/sigAPI";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

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

  const [sigData, setSigData] = useState<Sig | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userAccount.token) {
      return;
    }
    try {
      setIsLoading(true);
      const sigResponse = await sigAPI.getSigData(sigID);
      setSigData(sigResponse);
      const membersResponse = await sigAPI.getSigMembers(
        sigID,
        userAccount.token,
      );
      if (membersResponse && Array.isArray(membersResponse)) {
        setMembers(
          membersResponse.map((m: Member) => ({
            _id: m._id,
            code: m.code || "",
            name: m.name || "",
            email: m.email || "",
            class: m.class || "",
            sig: m.sig || [],
            avatar: m.avatar || "",
          })),
        );
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
    const data = members.map((m) => ({
      學號: m.code,
      姓名: m.name,
      Email: m.email,
      班級: m.class || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "成員名單");
    ws["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 10 }];
    XLSX.writeFile(
      wb,
      `${sigData?.name || "SIG"}_成員名單_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  }

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (userAccount.isLoading) {
    return <div></div>;
  }
  if (!userAccount.isLogin) {
    return <NotFoundPage />;
  }
  if (userAccount.userData?.permission !== 2) {
    return <NotFoundPage />;
  }

  const handleBack = () => router.push("/admin/sig-members");

  return isMobile ? (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-green-50 to-emerald-50 px-4 pt-4 pb-20">
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
            <p className="text-gray-500 text-xs">成員名單</p>
          </div>
        </div>

        {/* Action Card */}
        <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">目前成員數量</p>
              <p className="font-bold text-2xl text-green-600">
                {members.length}
              </p>
            </div>
            <button
              type="button"
              onClick={downloadXLSX}
              disabled={members.length === 0 || isLoading}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              下載
            </button>
          </div>
        </div>

        {/* Members List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-green-500 border-b-2"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-3xl">
              👥
            </div>
            <p className="text-gray-500">暫無成員資料</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => (
              <div
                key={member._id}
                className={`rounded-xl border border-gray-100 p-4 shadow-md ${index % 2 === 0 ? "bg-white" : "bg-green-50/50"}`}
              >
                <div className="flex items-center gap-3">
                  {member.avatar ? (
                    <Image
                      src={member.avatar}
                      alt={member.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border-2 border-green-100 object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 font-bold text-green-600 text-lg">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-800">
                      {member.name}
                    </p>
                    <p className="text-gray-500 text-xs">{member.code}</p>
                    <p className="truncate text-gray-400 text-xs">
                      {member.email}
                    </p>
                  </div>
                  {member.class && (
                    <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-1 text-green-700 text-xs">
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
    <div className="flex h-[calc(100%-2rem)] w-full flex-col overflow-hidden px-4 pt-4">
      <h1 className="mb-2 flex-shrink-0 text-center font-bold text-2xl text-gray-800">
        {sigData?.name} 成員名單
      </h1>
      <div className="mb-2 flex-shrink-0 text-center">
        <button
          type="button"
          onClick={downloadXLSX}
          disabled={members.length === 0 || isLoading}
          className="cursor-pointer rounded-lg bg-green-500 px-6 py-2 text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-300"
        >
          下載 XLSX
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="ml-2 cursor-pointer rounded-lg bg-gray-500 px-6 py-2 text-white transition-colors hover:bg-gray-600"
        >
          ← 返回
        </button>
      </div>
      <div className="mx-auto w-full max-w-5xl flex-1 overflow-hidden rounded-lg border border-gray-200 shadow-lg">
        <div className="h-full overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="w-[20%] px-2 py-3 text-center font-semibold">
                  學號
                </th>
                <th className="w-[20%] px-2 py-3 text-center font-semibold">
                  姓名
                </th>
                <th className="w-[45%] px-2 py-3 text-center font-semibold">
                  Email
                </th>
                <th className="w-[15%] px-2 py-3 text-center font-semibold">
                  班級
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin border-green-500 border-b-2"></div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    暫無成員資料
                  </td>
                </tr>
              ) : (
                members.map((m, i) => (
                  <tr
                    key={m._id}
                    className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="px-2 py-3 text-center">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800 text-xs">
                        {m.code}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">{m.name}</td>
                    <td className="px-2 py-3 text-center">{m.email}</td>
                    <td className="px-2 py-3 text-center text-gray-500">
                      {m.class || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mx-auto mt-2 w-full max-w-5xl flex-shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-6 py-3 text-center">
        成員數量：
        <strong className="text-blue-600">
          {isLoading ? "載入中..." : members.length}
        </strong>{" "}
        人
      </div>
    </div>
  );
}

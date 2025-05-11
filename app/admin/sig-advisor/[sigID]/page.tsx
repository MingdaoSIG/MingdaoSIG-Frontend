"use client";

import { useUserAccount } from "@/utils/useUserAccount";
import NotFoundPage from "@/app/not-found";
import useIsMobile from "@/utils/useIsMobile";
import { useRouter } from "next/navigation";
import sigAPI from "@/modules/sigAPI";
import { useEffect, useState } from "react";

export default function AdminPage({ params }: { params: { sigID: string } }) {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();

  const [sigData, setSigData] = useState<any>({});
  const [advisors, setAdvisors] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigData(params.sigID);
        setSigData(response);

        if (response.moderator && response.moderator.length > 0) {
          setAdvisors([]);

          const addedAdvisorIds = new Set();

          await Promise.all(
            response.moderator.map(async (advisorId: string) => {
              try {
                if (addedAdvisorIds.has(advisorId)) {
                  return;
                }

                const res = await sigAPI.getUserData(advisorId);

                if (res) {
                  addedAdvisorIds.add(advisorId);
                  setAdvisors(prev => {
                    const isDuplicate = prev.some(advisor => advisor._id === res._id);

                    if (!isDuplicate) {
                      return [...prev, res];
                    }
                    return prev;
                  });
                }
              } catch (error) {
                console.error(`Error fetching data for advisor ${advisorId}:`, error);
              }
            })
          );
        }
      } catch (error: any) {
        console.error(error.message);
      }
    })();
  }, [params.sigID]);

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

  const handleBack = () => {
    router.push("/admin/sig-advisor");
  };

  return isMobile ? (
    <div className="flex flex-col justify-start w-screen h-screen pt-[4rem] pb-[4rem] px-2 relative overflow-y-auto">
      <div className="pt-[1rem] pb-[1rem]">
        <div className="w-full flex text-center mb-6">
          <button
            onClick={handleBack}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full mx-auto"
          >
            ← 返回
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4"><span className="text-red-500">{sigData.name}</span> 指導老師管理</h1>
          <p className="text-xl mb-4">指導老師列表：</p>
          <div className="flex">
            <table className="w-full mx-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">姓名</th>
                  <th className="px-4 py-2 border-b">Email</th>
                </tr>
              </thead>
              <tbody>
                {advisors && advisors.map((advisor: any) => {
                  return (
                    <tr key={advisor._id}>
                      <td className="px-4 py-2 border-b">{advisor.name}</td>
                      <td className="px-4 py-2 border-b">{advisor.email}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="pt-5 h-[calc(100%-6.5rem)] relative">
      <div className="w-full flex text-center mb-6">
        <button
          onClick={handleBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full mx-auto"
        >
          ← 返回
        </button>
      </div>
      <div className="flex flex-col items-center justify-start h-full">
        <h1 className="text-3xl font-bold mb-4"><span className="text-red-500">{sigData.name}</span> 指導老師管理</h1>
        <p className="text-xl mb-4">指導老師列表：</p>
        <div className="flex">
          <table className="w-full mx-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">姓名</th>
                <th className="px-4 py-2 border-b">Email</th>
              </tr>
            </thead>
            <tbody>
              {advisors && advisors.map((advisor: any) => {
                return (
                  <tr key={advisor._id}>
                    <td className="px-4 py-2 border-b">{advisor.name}</td>
                    <td className="px-4 py-2 border-b">{advisor.email}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
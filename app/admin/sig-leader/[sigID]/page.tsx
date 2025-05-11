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
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigData(params.sigID);
        setSigData(response);

        if (response.leader && response.leader.length > 0) {
          setLeaders([]);

          const addedLeaderIds = new Set();

          await Promise.all(
            response.leader.map(async (leaderId: string) => {
              try {
                if (addedLeaderIds.has(leaderId)) {
                  return;
                }

                const res = await sigAPI.getUserData(leaderId);

                if (res) {
                  addedLeaderIds.add(leaderId);
                  setLeaders(prev => {
                    const isDuplicate = prev.some(leader => leader._id === res._id);

                    if (!isDuplicate) {
                      return [...prev, res];
                    }
                    return prev;
                  });
                }
              } catch (error) {
                console.error(`Error fetching data for leader ${leaderId}:`, error);
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
    router.push("/admin/sig-leader");
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
          <h1 className="text-3xl font-bold mb-4"><span className="text-red-500">{sigData.name}</span> Leader 管理</h1>
          <p className="text-xl mb-4">Leader 列表：</p>
          <div className="flex">
            <table className="w-full mx-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">姓名</th>
                  <th className="px-4 py-2 border-b">Email</th>
                </tr>
              </thead>
              <tbody>
                {leaders && leaders.map((leader: any) => {
                  return (
                    <tr key={leader._id}>
                      <td className="px-4 py-2 border-b">{leader.name}</td>
                      <td className="px-4 py-2 border-b">{leader.email}</td>
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
        <h1 className="text-3xl font-bold mb-4"><span className="text-red-500">{sigData.name}</span> Leader 管理</h1>
        <p className="text-xl mb-4">Leader 列表：</p>
        <div className="flex">
          <table className="w-full mx-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">姓名</th>
                <th className="px-4 py-2 border-b">Email</th>
              </tr>
            </thead>
            <tbody>
              {leaders && leaders.map((leader: any) => {
                return (
                  <tr key={leader._id}>
                    <td className="px-4 py-2 border-b">{leader.name}</td>
                    <td className="px-4 py-2 border-b">{leader.email}</td>
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
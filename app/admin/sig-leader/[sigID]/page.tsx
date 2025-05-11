"use client";

import { useUserAccount } from "@/utils/useUserAccount";
import NotFoundPage from "@/app/not-found";
import useIsMobile from "@/utils/useIsMobile";
import { useRouter } from "next/navigation";
import sigAPI from "@/modules/sigAPI";
import { Fragment, useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";

export default function ManageSIGLeader({ params }: { params: { sigID: string } }) {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();

  const [sigData, setSigData] = useState<any>({});
  const [leaders, setLeaders] = useState<any[]>([]);

  // 使用 useCallback 包裝 fetchLeaders 函數，以確保它的引用在渲染間保持穩定
  const fetchLeaders = useCallback(async () => {
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
  }, [params.sigID]); // 只有當 sigID 改變時才重新創建函數

  function addLeader() {
    Swal.fire({
      title: "新增 Leader",
      input: "text",
      inputLabel: "請輸入要新增的 Leader 學號",
      inputPlaceholder: "例如: 11S001",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "請輸入學號!";
        }
      },
      confirmButtonText: "新增",
      cancelButtonText: "取消",
      confirmButtonColor: "#5fcdf5",
      customClass: {
        title: "text-lg font-bold",
        popup: "rounded-lg",
        confirmButton: "focus:outline-none",
        cancelButton: "focus:outline-none"
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const code = result.value;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/${params.sigID}/leader`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${userAccount.token}`,
          },
          body: JSON.stringify({
            code: code,
          }),
        });
        const data = await res.json();
        if (res.status === 200) {
          Swal.fire({
            title: "新增成功!",
            text: "成功新增 Leader!",
            icon: "success",
            confirmButtonText: "確定",
            confirmButtonColor: "#5fcdf5",
            customClass: {
              title: "text-lg font-bold",
              popup: "rounded-lg",
              confirmButton: "focus:outline-none"
            }
          });
          fetchLeaders();
        } else if (data.status === 4032) {
          Swal.fire({
            title: "新增失敗!",
            text: "該學號已經是 Leader!",
            icon: "error",
            confirmButtonText: "確定",
            confirmButtonColor: "#5fcdf5",
            customClass: {
              title: "text-lg font-bold",
              popup: "rounded-lg",
              confirmButton: "focus:outline-none"
            }
          });
        } else if (data.status === 4017) {
          Swal.fire({
            title: "新增失敗!",
            text: "該學號尚未註冊 SIG 帳號!",
            icon: "error",
            confirmButtonText: "確定",
            confirmButtonColor: "#5fcdf5",
            customClass: {
              title: "text-lg font-bold",
              popup: "rounded-lg",
              confirmButton: "focus:outline-none"
            }
          });
        } else {
          Swal.fire({
            title: "新增失敗!",
            text: "請聯絡開發者！",
            icon: "error",
            confirmButtonText: "確定",
            confirmButtonColor: "#5fcdf5",
            customClass: {
              title: "text-lg font-bold",
              popup: "rounded-lg",
              confirmButton: "focus:outline-none"
            }
          });
        }
      }
    });
  }

  function deleteLeader(leaderId: string) {
    Swal.fire({
      title: "確定要刪除這位 Leader 嗎?",
      text: "刪除後就必須重新新增，請謹慎操作!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "刪除",
      cancelButtonText: "取消"
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/${params.sigID}/leader`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${userAccount.token}`,
          },
          body: JSON.stringify({
            leaderId: leaderId,
          }),
        });
        const data = await res.json();
        console.log(data);
        if (res.status === 200) {
          Swal.fire({
            title: "刪除成功!",
            text: "成功刪除 Leader!",
            icon: "success",
            confirmButtonText: "確定",
            confirmButtonColor: "#5fcdf5",
            customClass: {
              title: "text-lg font-bold",
              popup: "rounded-lg",
              confirmButton: "focus:outline-none"
            }
          });
          fetchLeaders();
        } else {
          Swal.fire({
            title: "刪除失敗!",
            text: "請聯絡開發者！",
            icon: "error",
            confirmButtonText: "確定",
            confirmButtonColor: "#5fcdf5",
            customClass: {
              title: "text-lg font-bold",
              popup: "rounded-lg",
              confirmButton: "focus:outline-none"
            }
          });
        }
      }
    });
  }

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

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
          <button
            onClick={addLeader}
            className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-full mx-auto mb-2"
          >
            新增 Leader
          </button>
          <p className="text-xl mb-4">Leader 列表：</p>
          <div className="md:hidden w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-lg border border-black">
            <div className="max-h-[calc(100dvh-20.5rem)] overflow-y-auto">
              {leaders && leaders.map((leader: any, index: number) => {
                return (
                  <div
                    key={`${leader._id}-${index}`}
                    className={`p-4 ${index !== 0 ? "border-t border-black text-left grid grid-cols-10 gap-2" : "text-left grid grid-cols-10 gap-2"}`}
                  >
                    <div className="col-span-8 flex flex-col">
                      <div className="grid grid-cols-5 gap-2 mb-1">
                        <div className="font-semibold text-sm text-right">學號:</div>
                        <div className="col-span-4 text-sm">{leader.code}</div>
                      </div>
                      <div className="grid grid-cols-5 gap-2 mb-1">
                        <div className="font-semibold text-sm text-right">姓名:</div>
                        <div className="col-span-4 text-sm">{leader.name}</div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <div className="font-semibold text-sm text-right">Email:</div>
                        <div className="col-span-4 text-sm break-all">{leader.email}</div>
                      </div>
                    </div>
                    <div className="flex col-span-2">
                      <div className="flex justify-end mt-2 flex-col mx-auto">
                        <button className="bg-red-500 hover:bg-red-700 text-white py-1.5 px-3 rounded-full my-auto" onClick={() => deleteLeader(leader._id)}>
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
        <button
          onClick={addLeader}
          className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-full mx-auto mb-2"
        >
          新增 Leader
        </button>
        <p className="text-xl mb-4">Leader 列表：</p>
        <div className="flex flex-col w-full max-w-5xl mx-auto rounded-lg overflow-hidden shadow-lg border border-black">
          <div className="overflow-hidden">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-2/8" />
                <col className="w-2/8" />
                <col className="w-3/8" />
                <col className="w-1/8" />
              </colgroup>
              <thead className="bg-transparent text-black">
                <tr className="border-b-[1px] border-black">
                  <th className="px-6 py-3 text-center font-semibold">學號</th>
                  <th className="px-6 py-3 text-center font-semibold">姓名</th>
                  <th className="px-6 py-3 text-center font-semibold">Email</th>
                  <th className="px-6 py-3 text-center font-semibold">動作</th>
                </tr>
              </thead>
            </table>
          </div>
          <div className="overflow-y-auto max-h-96">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-2/8" />
                <col className="w-2/8" />
                <col className="w-3/8" />
                <col className="w-1/8" />
              </colgroup>
              <tbody className="bg-transparent divide-y divide-black">
                {leaders && leaders.map((leader: any) => {
                  return (
                    <Fragment key={leader._id}>
                      <tr className="transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-center">{leader.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">{leader.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">{leader.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button className="bg-red-500 hover:bg-red-700 text-white py-1.5 px-3.5 rounded-full ml-2 my-auto whitespace-nowrap text-center" onClick={() => deleteLeader(leader._id)}>
                            刪除
                          </button>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
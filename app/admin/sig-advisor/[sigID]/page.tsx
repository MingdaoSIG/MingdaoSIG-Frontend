"use client";

import { useUserAccount } from "@/utils/useUserAccount";
import NotFoundPage from "@/app/not-found";
import useIsMobile from "@/utils/useIsMobile";
import { useRouter } from "next/navigation";
import sigAPI from "@/modules/sigAPI";
import { Fragment, useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";

export default function ManageSIGAdvisor({ params }: { params: { sigID: string } }) {
  const isMobile = useIsMobile();
  const userAccount = useUserAccount();
  const router = useRouter();

  const [sigData, setSigData] = useState<any>({});
  const [advisors, setAdvisors] = useState<any[]>([]);

  const fetchAdvisors = useCallback(async () => {
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
  }, [params.sigID]);

  function addAdvisor() {
    Swal.fire({
      title: "新增指導老師",
      input: "text",
      inputLabel: "請輸入要新增的指導老師電子郵件",
      inputPlaceholder: "例如: atwang@ms.mingdao.edu.tw",
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
        confirmButton: "focus:outline-none",
        cancelButton: "focus:outline-none"
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const code = result.value;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/${params.sigID}/moderator`, {
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
            text: "成功新增指導老師!",
            icon: "success",
            confirmButtonText: "確定",
            confirmButtonColor: "#5fcdf5",
            customClass: {
              title: "text-lg font-bold",
              popup: "rounded-lg",
              confirmButton: "focus:outline-none"
            }
          });
          fetchAdvisors();
        } else if (data.status === 4033) {
          Swal.fire({
            title: "新增失敗!",
            text: "該電子郵件已經是指導老師!",
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
            text: "該電子郵件尚未註冊 SIG 帳號!",
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

  function deleteAdvisor(advisorId: string) {
    Swal.fire({
      title: "確定要刪除這位指導老師嗎?",
      text: "刪除後就必須重新新增，請謹慎操作!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "刪除",
      cancelButtonText: "取消"
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/${params.sigID}/moderator`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${userAccount.token}`,
          },
          body: JSON.stringify({
            moderatorId: advisorId,
          }),
        });
        const data = await res.json();
        console.log(data);
        if (res.status === 200) {
          Swal.fire({
            title: "刪除成功!",
            text: "成功刪除指導老師!",
            icon: "success",
            confirmButtonText: "確定",
            confirmButtonColor: "#5fcdf5",
            customClass: {
              title: "text-lg font-bold",
              popup: "rounded-lg",
              confirmButton: "focus:outline-none"
            }
          });
          fetchAdvisors();
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
    fetchAdvisors();
  }, [fetchAdvisors]);

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
          <button
            onClick={addAdvisor}
            className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-full mx-auto mb-2"
          >
            新增指導老師
          </button>
          <p className="text-xl mb-4">指導老師列表：</p>
          <div className="md:hidden w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-lg border border-black">
            <div className="max-h-[calc(100dvh-20.5rem)] overflow-y-auto">
              {advisors && advisors.map((advisor: any, index: number) => {
                return (
                  <div
                    key={`${advisor._id}-${index}`}
                    className={`p-4 ${index !== 0 ? "border-t border-black text-left grid grid-cols-10 gap-2" : "text-left grid grid-cols-10 gap-2"}`}
                  >
                    <div className="col-span-8 flex flex-col">
                      <div className="grid grid-cols-5 gap-2 mb-1">
                        <div className="font-semibold text-sm text-right">姓名:</div>
                        <div className="col-span-4 text-sm">{advisor.name}</div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <div className="font-semibold text-sm text-right">Email:</div>
                        <div className="col-span-4 text-sm break-all">{advisor.email}</div>
                      </div>
                    </div>
                    <div className="flex col-span-2">
                      <div className="flex justify-end mt-2 flex-col mx-auto">
                        <button className="bg-red-500 hover:bg-red-700 text-white py-1.5 px-3 rounded-full my-auto" onClick={() => deleteAdvisor(advisor._id)}>
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
        <h1 className="text-3xl font-bold mb-4"><span className="text-red-500">{sigData.name}</span> 指導老師管理</h1>
        <button
          onClick={addAdvisor}
          className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-full mx-auto mb-2"
        >
          新增指導老師
        </button>
        <p className="text-xl mb-4">指導老師列表：</p>
        <div className="flex flex-col w-full max-w-5xl mx-auto rounded-lg overflow-hidden shadow-lg border border-black">
          <div className="overflow-hidden">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-2/6" />
                <col className="w-3/6" />
                <col className="w-1/6" />
              </colgroup>
              <thead className="bg-transparent text-black">
                <tr className="border-b-[1px] border-black">
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
                <col className="w-2/6" />
                <col className="w-3/6" />
                <col className="w-1/6" />
              </colgroup>
              <tbody className="bg-transparent divide-y divide-black">
                {advisors && advisors.map((advisor: any) => {
                  return (
                    <Fragment key={advisor._id}>
                      <tr className="transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-center">{advisor.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">{advisor.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button className="bg-red-500 hover:bg-red-700 text-white py-1.5 px-3.5 rounded-full ml-2 my-auto whitespace-nowrap text-center" onClick={() => deleteAdvisor(advisor._id)}>
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
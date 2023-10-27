"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, notFound } from "next/navigation";

import SwitchButton from "./(User)/SwitchButton";
import SplitBlock from "../(Layout)/splitBlock";
import { ThreadsList } from "@/components/Threads/desktop/ThreadsList";
import { IThread } from "@/interfaces/Thread.interface";
import { GetUserPostListAPI, GetSIGPostListAPI } from "./(User)/API";
import useIsMobile from "@/utils/useIsMobile";
import style from "./user.module.scss";
import { Sig, User } from "@/interfaces/User";
import Info from "./(User)/desktop/Info";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UserPage({ params }: { params: { userID: string } }) {
  if (!decodeURIComponent(params.userID).startsWith("@")) {
    notFound();
  }

  const id = decodeURIComponent(params.userID);
  const route = useRouter();
  const isMobile = useIsMobile();

  const [posts, setPosts] = useState<IThread[]>([]);
  const [status, setStatus] = useState("loading");
  const [listType, setListType] = useState(0);
  const [reqTime, setReqTime] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<User | Sig | null>(null);

  // useEffect(() => {
  //   if (!id.startsWith("@")) {
  //     notFound();
  //   } else if (id.length < 2) {
  //     setStatus("notfound");
  //   }

  //   if (reqTime === 0) {
  //     GetUserAPI(id, setStatus, setData, setReqTime);
  //   }

  //   if (status === "loading2") {
  //     GetSIGAPI(id, setStatus, setData);
  //   }
  // }, [id, data._id, status, reqTime]);

  // useEffect(() => {
  //   if (status === "success") {
  //     GetUserPostListAPI(data, setPosts);
  //   } else if (status === "loading3") {
  //     GetSIGPostListAPI(data, setPosts, setStatus);
  //   }
  // }, [status, data]);


  useEffect(() => {
    (async () => {
      const userData = await GetUser(id);
      const sigData = await GetSIG(id);

      if (userData !== null && sigData !== null && !(userData && sigData)) {
        setIsLoading(false);
        return setData(userData || sigData);
      } else {
        setIsLoading(false);
        return setData(null);
      }
    });
  }, []);

  // if (status === "notfound") {
  //   return (
  //     <div className="flex flex-col m-auto">
  //       <h1 className="text-[50px]">User or SIG Not Found.</h1>
  //       <button
  //         className="bg-[#0090BD] bg-opacity-60 rounded-2xl w-[180px] h-[60px] block m-auto text-white mt-5 text-[20px]"
  //         onClick={() => {
  //           route.push("/");
  //         }}
  //       >
  //         Back to home
  //       </button>
  //     </div>
  //   );
  // } else if (
  //   status === "loading" ||
  //   status === "loading2" ||
  //   status === "loading3"
  // ) {
  //   return (
  //     <div className="flex align-middle justify-center">
  //       <h1 className="text-[50px]"> Loading...</h1>
  //     </div>
  //   );
  // } else if (status === "success" || status === "success2") {

  // }

  return isMobile ? (
    <></>
  ) : (
    <SplitBlock>
      <div className="flex flex-col items-start gap-[20px] max-h-[65dvh]">
        {/* <SwitchButton callback={setListType} posts={posts!}></SwitchButton> */}
        <ThreadsList posts={posts} height="auto" />
      </div >
      <Info user={{
        "_id": "6517b7b22ee473ac669f205b",
        "customId": "oncloud",
        "name": "廖耿鋒",
        "description": "哈囉你好～我是OnCloud，也可以叫我上雲。我是一位從寫Discord Bot起步的全端工程師和系統工程師，開發過不少網站，其中包括MDSIG平台哦！我主要使用JavaScript和TypeScript，熱愛後端開發和API、資料庫的操作。我也對伺服器、防火牆和網路等領域有深入研究。我是 MDCPP 網頁班的講師，同時創立了資安研究社 (MDCSL)，歡迎大家加入我的社群！\n\n另外，我想介紹一個超棒的項目，叫做 NewMD。它致力於改善明道中學課表網頁，加快載入速度、減少當機，同時美化課表外觀。如果你是明道中學的學生，一定要試試NewMD，絕對讓你驚喜連連！",
        "avatar": "https://lh3.googleusercontent.com/a/ACg8ocJIwiNt2m_Z20uBCsfHgtfKo2kjiJcpTloGPbHlSHDA3Q",
      }} />
    </SplitBlock >
  );
}

async function GetUser(userId: string) {
  try {
    const response = await (
      await fetch(`${API_URL}/user/${userId.toLowerCase()}`, {
        method: "GET",
      })
    ).json();

    if (response.status !== 2000) throw new Error("Internal Error");

    return response.data;
  } catch (error) {
    return false;
  }
}

async function GetSIG(userId: string) {
  try {
    const response = await (
      await fetch(`${API_URL}/sig/${userId.toLowerCase()}`, {
        method: "GET",
      })
    ).json();

    if (response.status !== 2000) throw new Error("Internal Error");

    return response.data;
  } catch (error) {
    return false;
  }
}
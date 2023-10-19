"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, notFound } from "next/navigation";

import SwitchButton from "./(User)/SwitchButton";
import SplitBlock from "../(Layout)/splitBlock";
import { ThreadsList as _ThreadsList } from "@/components/Threads/desktop/ThreadsList";
import { IThread } from "@/interfaces/Thread.interface";
import { GetUserPostListAPI, GetSIGPostListAPI } from "./(User)/API";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const sigDefaultCover: { [key: string]: string } = {
  "651799ebfa1d45d97b139864": "https://i.ibb.co/WnFmWzV/image.png", // 資安
  "6529ed87df4ae96f279cd5e3": "https://i.ibb.co/1dTBSBz/image.png", // 資訊程式設計
  "6529ee3cdf4ae96f279cd5e4": "https://i.ibb.co/JnxbWgM/image.png", // 機器人設計與製造
  "6529ee57df4ae96f279cd5e5": "https://i.ibb.co/vVwzchq/image.png", // 建築設計
  "6529eed9df4ae96f279cd5e6": "https://i.ibb.co/TvwkHxn/image.png", // 生科動科與環境
  "6529eeeddf4ae96f279cd5e7": "https://i.ibb.co/pzS94CM/image.png", // 醫學
  "6529efbfdf4ae96f279cd5ec": "https://i.ibb.co/xs69FqH/image.png", // 醫學相關
  "6529efe9df4ae96f279cd5ee": "https://i.ibb.co/ygVnfVm/image.png", // 法政
  "6529effbdf4ae96f279cd5ef": "", // 社心教育
  "6529f011df4ae96f279cd5f0": "https://i.ibb.co/pzfBgdP/image.png", // 音樂表藝
  "6529f05ddf4ae96f279cd5f1": "https://i.ibb.co/FXjMXQs/image.png", // 大眾傳播
  "6529f06edf4ae96f279cd5f2": "https://i.ibb.co/FztWpQ2/image.png", // 文史哲
  "6529f07ddf4ae96f279cd5f3": "", // 財經
  "6529f094df4ae96f279cd5f4": "https://i.ibb.co/znBp0Qm/image.png", // 無人機
  "6529f0a2df4ae96f279cd5f5": "", // 經濟與管理
  "6529f0c4df4ae96f279cd5f6": "https://i.ibb.co/DWggfbB/image.png", // 元宇宙
  "6529f0dbdf4ae96f279cd5f7": "https://i.ibb.co/yPsp1PY/image.png", // 直播
  "6529f0eedf4ae96f279cd5f8": "https://i.ibb.co/56JF3fX/image.png", // 科學教育
  "652b851ca1bd096e024475c4": "https://i.ibb.co/sC88YBs/image.png", // 雲端
};

export default function UserPage({ params }: { params: { userID: string } }) {
  if (!decodeURIComponent(params.userID).startsWith("@")) {
    notFound();
  }

  const UserID = decodeURIComponent(params.userID);
  const route = useRouter();

  const [posts, setPosts] = useState<IThread[]>([]);
  const [status, setStatus] = useState("loading");
  const [listType, setListType] = useState(0);
  const [reqTime, setReqTime] = useState<number>(0);
  const [user, setUser] = useState({
    _id: "",
    name: "",
    description: "",
    avatar: "",
    customId: "",
  });

  useEffect(() => {
    if (!UserID.startsWith("@")) {
      notFound();
    } else if (UserID.length < 2) {
      setStatus("notfound");
    }

    if (reqTime === 0) {
      GetUserAPI(UserID, setStatus, setUser, setReqTime);
    }

    if (status === "loading2") {
      GetSIGAPI(UserID, setStatus, setUser);
    }
  }, [UserID, user._id, status, reqTime]);

  useEffect(() => {
    if (status === "success") {
      GetUserPostListAPI(user, setPosts);
    } else if (status === "loading3") {
      GetSIGPostListAPI(user, setPosts, setStatus);
    }
  }, [status, user]);

  if (status === "notfound") {
    return (
      <div className="flex flex-col m-auto">
        <h1 className="text-[50px]">User or SIG Not Found.</h1>
        <button
          className="bg-[#0090BD] bg-opacity-60 rounded-2xl w-[180px] h-[60px] block m-auto text-white mt-5 text-[20px]"
          onClick={() => {
            route.push("/");
          }}
        >
          Back to home
        </button>
      </div>
    );
  } else if (
    status === "loading" ||
    status === "loading2" ||
    status === "loading3"
  ) {
    return (
      <div className="flex flex-col m-auto">
        <h1 className="text-[50px]"> Loading...</h1>
      </div>
    );
  } else if (status === "success" || status === "success2") {
    const badge = [
      <div
        className="bg-[rgb(130,215,255)] bg-opacity-50 ml-5 px-3 py-auto h-[35px] rounded-full my-auto grid gap-2 absolute top-[calc(33.333333%+20px)] right-[15px] grid-cols-1"
        key={"badge"}
      >
        <div className="group my-auto relative" key={"developer"}>
          <Image
            src={"/icons/developer.svg"}
            height={24}
            width={24}
            alt="developer"
            className="developer my-auto"
          />
          <span className="group-hover:opacity-100 transition-opacity bg-[rgb(0,190,245)] px-1 text-sm text-white rounded-md absolute left-1/2 -translate-x-1/2 translate-y-none opacity-0 m-4 mx-auto">
            Developer
          </span>
        </div>
      </div>,
    ];
    return (
      <SplitBlock>
        <div className="flex flex-col items-start gap-[20px] max-h-[65dvh]">
          <SwitchButton callback={setListType} posts={posts!}></SwitchButton>
          <_ThreadsList posts={posts} height="auto" />
        </div>
        <div className="flex flex-col h-full relative">
          <div className="flex-initial h-1/3 bg-[url('/images/banner.svg')] bg-cover rounded-t-[30px]"></div>
          <div className="flex flex-col h-2/3 bg-white py-2 items-stretch rounded-b-[30px]">
            <div className="mt-[70px] ml-10">
              <div className="text-[#002024] font-normal text-[24px] flex h-[36px]">
                {user?.name}
              </div>
              <div className="text-[#006180] font-normal text-[14px]">
                {user?.customId.length !== 0 && "@"}
                {user?.customId}
              </div>
            </div>
            <div className="my-5 mx-10 h-[60%] overflow-y-auto px-1">
              {user?.description.split("\n").map((line) => (
                <>
                  <p key={line}>{line}</p>
                </>
              ))}
            </div>
          </div>
          <div className="h-[120px] w-[120px] bg-white flex-none absolute top-1/4 left-[15px] rounded-full">
            <Image
              src={user?.avatar || sigDefaultCover[user._id]}
              width={100}
              height={100}
              alt="Avatar"
              className="rounded-full m-auto block mt-[10px]"
            />
          </div>
          {(user?._id === "65179f64cf392fefee97191f" ||
            user?._id === "6517b7b22ee473ac669f205b" ||
            user?._id === "6517b7b22ee473ac669f205b" ||
            user?._id === "6525225146132ec53332a820") &&
            badge[0]}
        </div>
      </SplitBlock>
    );
  }
}

async function GetUserAPI(
  UserID: string,
  setStatus: Dispatch<SetStateAction<string>>,
  setUser: Dispatch<
    SetStateAction<{
      _id: string;
      name: string;
      description: string;
      avatar: string;
      customId: string;
    }>
  >,
  setReqTime: Dispatch<SetStateAction<number>>
) {
  if (UserID.length < 2) {
    setStatus("notfound");
    return;
  } else {
    try {
      const res = await (
        await fetch(`${API_URL}/user/${UserID.toLocaleLowerCase()}`, {
          method: "GET",
        })
      ).json();
      if (res.status === 4000) {
        setStatus("loading2");
        setReqTime(1);
      } else if (res.status === 2000) {
        setUser(res.data);
        setStatus("success");
      } else {
        setStatus("loading2");
      }

      return;
    } catch (error) {
      console.log(error);
    }
  }
}

async function GetSIGAPI(
  UserID: string,
  setStatus: Dispatch<SetStateAction<string>>,
  setUser: Dispatch<
    SetStateAction<{
      _id: string;
      name: string;
      description: string;
      avatar: string;
      customId: string;
    }>
  >
) {
  if (UserID.length < 2) {
    setStatus("notfound");
    return;
  } else {
    try {
      const res = await (
        await fetch(`${API_URL}/sig/${UserID.toLocaleLowerCase()}`, {
          method: "GET",
        })
      ).json();
      if (res.status === 4000) {
        setStatus("notfound");
      } else {
        setUser(res.data);
        setStatus("loading3");
      }

      return;
    } catch (error) {
      console.log(error);
    }
  }
}

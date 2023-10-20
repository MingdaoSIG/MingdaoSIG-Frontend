"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, notFound } from "next/navigation";

import SwitchButton from "./(User)/SwitchButton";
import SplitBlock from "../(Layout)/splitBlock";
import { ThreadsList as _ThreadsList } from "@/components/Threads/desktop/ThreadsList";
import { IThread } from "@/interfaces/Thread.interface";
import { GetUserPostListAPI, GetSIGPostListAPI } from "./(User)/API";
import style from "./user.module.scss";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const sigDefaultCover: { [key: string]: string } = {
  "651799ebfa1d45d97b139864":
    "https://sig-api.lazco.dev/image/653296b40b891d1f6b5b4412", // 資安
  "6529ed87df4ae96f279cd5e3":
    "https://sig-api.lazco.dev/image/653299ff0b891d1f6b5b4460", // 資訊程式設計
  "6529ee3cdf4ae96f279cd5e4":
    "https://sig-api.lazco.dev/image/653297ed0b891d1f6b5b4416", // 機器人
  "6529ee57df4ae96f279cd5e5":
    "https://sig-api.lazco.dev/image/653299f10b891d1f6b5b445c", // 建築設計
  "6529eed9df4ae96f279cd5e6":
    "https://sig-api.lazco.dev/image/6532988f0b891d1f6b5b4432", // 生科動科與環境
  "6529eeeddf4ae96f279cd5e7":
    "https://sig-api.lazco.dev/image/653298e00b891d1f6b5b4446", // 醫學
  "6529efbfdf4ae96f279cd5ec":
    "https://sig-api.lazco.dev/image/6532983d0b891d1f6b5b4422", // 醫學相關
  "6529efe9df4ae96f279cd5ee":
    "https://sig-api.lazco.dev/image/6532982d0b891d1f6b5b441e", // 法政
  "6529effbdf4ae96f279cd5ef":
    "https://sig-api.lazco.dev/image/653298c70b891d1f6b5b4442", // 社心教育
  "6529f011df4ae96f279cd5f0":
    "https://sig-api.lazco.dev/image/65329a0f0b891d1f6b5b4464", // 音樂表藝
  "6529f05ddf4ae96f279cd5f1":
    "https://sig-api.lazco.dev/image/653298fa0b891d1f6b5b444e", // 大眾傳播
  "6529f06edf4ae96f279cd5f2":
    "https://sig-api.lazco.dev/image/653298490b891d1f6b5b4426", // 文史哲
  "6529f07ddf4ae96f279cd5f3":
    "https://sig-api.lazco.dev/image/653298eb0b891d1f6b5b444a", // 財經
  "6529f094df4ae96f279cd5f4":
    "https://sig-api.lazco.dev/image/653298b00b891d1f6b5b443e", // 無人機
  "6529f0a2df4ae96f279cd5f5":
    "https://sig-api.lazco.dev/image/653298620b891d1f6b5b442e", // 經濟與管理
  "6529f0c4df4ae96f279cd5f6":
    "https://sig-api.lazco.dev/image/653298a60b891d1f6b5b443a", // 元宇宙
  "6529f0dbdf4ae96f279cd5f7":
    "https://sig-api.lazco.dev/image/653298570b891d1f6b5b442a", // 直播
  "6529f0eedf4ae96f279cd5f8":
    "https://sig-api.lazco.dev/image/653298110b891d1f6b5b441a", // 科學教育
  "652d60b842cdf6a660c2b778":
    "https://sig-api.lazco.dev/image/653299930b891d1f6b5b4458", // 公告
  "65321d65e226c78161c22807":
    "https://sig-api.lazco.dev/image/653298990b891d1f6b5b4436", // 遊憩運動
  "65321d83e226c78161c22808":
    "https://sig-api.lazco.dev/image/653299040b891d1f6b5b4452", // 電機物理
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
        className="bg-[rgb(100,100,100)] bg-opacity-10 ml-5 px-3 py-auto h-[35px] rounded-md my-auto grid gap-3 absolute top-[calc(33.333333%_+_10px)] grid-cols-2 left-[8rem]"
        key={"badge"}
      >
        <div className="group my-auto relative" key={"developer"}>
          <Image
            src={"/badges/developer.svg"}
            height={24}
            width={24}
            alt="developer"
            className="developer my-auto"
          />
          <span className="group-hover:opacity-100 transition-opacity bg-[rgb(0,190,245)] px-1 text-sm text-white rounded-md absolute left-1/2 -translate-x-1/2 translate-y-none opacity-0 m-4 mx-auto whitespace-nowrap inline-block">
            Developer
          </span>
        </div>
        <div className="group my-auto relative" key={"developer"}>
          <Image
            src={"/badges/1021user.svg"}
            height={24}
            width={24}
            alt="developer"
            className="developer my-auto"
          />
          <span className="group-hover:opacity-100 transition-opacity bg-[rgb(0,190,245)] px-1 text-sm text-white rounded-md absolute left-1/2 -translate-x-1/2 translate-y-none opacity-0 m-4 mx-auto whitespace-nowrap inline-block">
            10/21 Event Participant
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
          <div className="flex-initial h-1/3 bg-[url('/images/banner.svg')] bg-cover bg-center rounded-t-[30px]"></div>
          <div className="flex flex-col h-2/3 bg-white py-2 items-stretch rounded-b-[30px]">
            <div className="mt-[50px] ml-10">
              <div className="text-[#002024] font-normal text-[24px] flex h-[36px]">
                {user?.name}
              </div>
              <div className="text-[#006180] font-normal text-[14px]">
                {user?.customId.length !== 0 && "@"}
                {user?.customId}
              </div>
            </div>
            <div className="my-5 mx-10 h-[60%] overflow-y-auto">
              {user?.description.split("\n").map((line) => (
                <>
                  <p key={line}>{line}</p>
                </>
              ))}
            </div>
          </div>
          <Image
            src={user?.avatar || sigDefaultCover[user._id]}
            width={100}
            height={100}
            alt="Avatar"
            className={style.avatar}
          />
          {(user?._id === "65179f64cf392fefee97191f" || // Haco
            user?._id === "652f28f5577c25ec87b5050e" || // Meru
            user?._id === "6517b7b22ee473ac669f205b" || // OnCloud
            user?._id === "6525225146132ec53332a820") && // Lazp
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

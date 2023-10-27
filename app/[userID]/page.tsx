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
import { User } from "@/interfaces/User";
import Info from "./(User)/desktop/Info";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UserPage({ params }: { params: { userID: string } }) {
  if (!decodeURIComponent(params.userID).startsWith("@")) {
    notFound();
  }

  const UserID = decodeURIComponent(params.userID);
  const route = useRouter();
  const isMobile = useIsMobile();

  const [posts, setPosts] = useState<IThread[]>([]);
  const [status, setStatus] = useState("loading");
  const [listType, setListType] = useState(0);
  const [reqTime, setReqTime] = useState<number>(0);
  const [user, setUser] = useState<User>({
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
      <div className="flex align-middle justify-center">
        <h1 className="text-[50px]"> Loading...</h1>
      </div>
    );
  } else if (status === "success" || status === "success2") {
    return isMobile ? (
      <></>
    ) : (
      <SplitBlock>
        <div className="flex flex-col items-start gap-[20px] max-h-[65dvh]">
          {/* <SwitchButton callback={setListType} posts={posts!}></SwitchButton> */}
          < ThreadsList posts={posts} height="auto" />
        </div >
        <Info user={user} />
      </SplitBlock >
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

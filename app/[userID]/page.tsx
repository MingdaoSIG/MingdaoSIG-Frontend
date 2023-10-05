"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, notFound } from "next/navigation";

import SwitchButton from "./(User)/SwitchButton";
import SplitBlock from "../(Layout)/splitBlock";
import { ThreadsList as _ThreadsList } from "@/components/ThreadsList/ThreadsList";
import { IThread } from "@/interface/Thread.interface";
import { GetUserPostListAPI } from "./(User)/API";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UserPage({ params }: { params: { userID: string } }) {
  const UserID = decodeURIComponent(params.userID);
  const route = useRouter();

  const [posts, setPosts] = useState<IThread[]>([]);
  const [status, setStatus] = useState("loading");
  const [listType, setListType] = useState(0);
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

    GetUserAPI(UserID, setStatus, setUser);
  }, [UserID, user._id]);

  useEffect(() => {
    if (status === "success") {
      GetUserPostListAPI(user, setPosts);
    }
  }, [status, user]);

  if (status === "notfound") {
    return (
      <div className="flex flex-col m-auto">
        <h1 className="text-[50px]">User Not Found.</h1>
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
  } else {
    return (
      <SplitBlock>
        <div className="flex flex-col items-start gap-[20px] max-h-[65dvh]">
          <SwitchButton callback={setListType} posts={posts!}></SwitchButton>
          <_ThreadsList posts={posts} height="auto" />
        </div>
        <div className="flex flex-col h-full relative">
          <div className="flex-initial h-1/3 bg-[url('/images/banner.svg')] bg-cover"></div>
          <div className="flex flex-col h-2/3 bg-white py-2 items-stretch">
            <div className="mt-[70px] ml-10">
              <div className="text-[#002024] font-normal text-[24px]">
                {user?.name}
              </div>
              <div className="text-[#006180] font-normal text-[14px]">
                @{user?.customId}
              </div>
            </div>
            <div className="my-5 mx-10 h-[60%] overflow-y-auto px-1">
              <p>{user?.description}</p>
            </div>
          </div>
          <div className="h-[120px] w-[120px] bg-white flex-none absolute top-1/4 left-10 rounded-full">
            <Image
              src={user?.avatar}
              width={100}
              height={100}
              alt="Avatar"
              className="rounded-full m-auto block mt-[10px]"
            />
          </div>
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
  >
) {
  if (UserID.length < 2) {
    setStatus("notfound");
    return;
  } else {
    try {
      const res = await (
        await fetch(`${API_URL}/profile/user/${UserID.toLocaleLowerCase()}`, {
          method: "GET",
        })
      ).json();
      if (res.status === 4000) {
        setStatus("notfound");
      } else {
        setUser(res.data);
        setStatus("success");
      }

      return;
    } catch (error) {
      console.log(error);
    }
  }
}

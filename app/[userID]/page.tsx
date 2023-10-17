"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, notFound } from "next/navigation";

import SwitchButton from "./(User)/SwitchButton";
import SplitBlock from "../(Layout)/splitBlock";
import { ThreadsList as _ThreadsList } from "@/components/Threads/desktop/ThreadsList";
import { IThread } from "@/interface/Thread.interface";
import { GetUserPostListAPI } from "./(User)/API";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UserPage({ params }: { params: { userID: string } }) {
  if (!decodeURIComponent(params.userID).startsWith("@")) {
    notFound();
  }

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
  } else if (status === "loading") {
    return (
      <div className="flex flex-col m-auto">
        <h1 className="text-[50px]"> Loading...</h1>
      </div>
    );
  } else if (status === "success") {
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
              <p>{user?.description}</p>
            </div>
          </div>
          <div className="h-[120px] w-[120px] bg-white flex-none absolute top-1/4 left-[15px] rounded-full">
            <Image
              src={user?.avatar}
              width={100}
              height={100}
              alt="Avatar"
              className="rounded-full m-auto block mt-[10px]"
            />
          </div>
          {(user?._id === "65179f64cf392fefee97191f" || user?._id === "6517b7b22ee473ac669f205b" || user?._id === "6517b7b22ee473ac669f205b" || user?._id === "6525225146132ec53332a820") && badge[0]}
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
        await fetch(`${API_URL}/user/${UserID.toLocaleLowerCase()}`, {
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

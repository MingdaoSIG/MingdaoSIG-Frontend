"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Components
import Reply from "../components/Reply";

// Styles
import style from "./Thread.module.scss";

// Interfaces
import { IThread } from "@/interfaces/Thread.interface";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ThreadInfo({ post }: { post: IThread }) {
  const [typeText, setTypeText] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sig, setSig] = useState<any>(null);

  const route = useRouter();

  useEffect(() => {
    GetUserAPI();
    GetSigAPI();

    async function GetUserAPI() {
      try {
        const res = await (
          await fetch(`${API_URL}/user/${post.user}`, {
            method: "GET",
          })
        ).json();
        setUser(res.data);

        return;
      } catch (error) {
        console.log(error);
      }
    }

    async function GetSigAPI() {
      try {
        const res = await (
          await fetch(`${API_URL}/sig/${post.sig}`, {
            method: "GET",
          })
        ).json();
        setSig(res.data);

        return;
      } catch (error) {
        console.log(error);
      }
    }
  }, [post.user, post.sig]);

  return (
    <div className={style.info + " box-border"}>
      <div
        className="flex justify-between items-center flex-initial relative h-[64px]"
        onClick={() => route.push(`/@${user.customId}`)}
      >
        <div className={style.author + " select-none"}>
          <Image
            src={user?.avatar}
            width={64}
            height={64}
            alt="Avatar"
            className="rounded-full w-[64px] h-[64px] flex-initial"
          ></Image>
          <div className="flex flex-col items-start my-auto flex-initial w-auto">
            <div className={style.name + " flex"}>{user?.name}</div>
            <div className="opacity-50">{sig?.name}</div>
            <div className={style.time}>
              {new Date(post?.createdAt).toLocaleString("zh-TW").split(" ")[0]}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-[40px] overflow-auto h-[calc(100%-42px-64px)]">
        {/* <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply> */}
      </div>
      <div className="h-[42px] w-full flex-none bg-[#D5E5E8] rounded-full mt-5 border border-[#BDBDBD] pl-[12px] flex bottom-5">
        <input
          className="focus-visible:outline-none px-3 w-full h-full bg-transparent flex-1 disabled:cursor-not-allowed"
          placeholder="Reply..."
          onChange={(e) => {
            e.target.value.length > 0 ? setTypeText(true) : setTypeText(false);
          }}
          disabled
        />
        <div className="h-full w-[40px] flex-none">
          <Image
            src={"/icons/bx-send.svg"}
            height={24}
            width={24}
            alt="send"
            className={
              "mt-auto h-full " +
              (typeText
                ? "opacity-100 cursor-pointer"
                : "opacity-30 cursor-not-allowed")
            }
          />
        </div>
      </div>
    </div>
  );
}

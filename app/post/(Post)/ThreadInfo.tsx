"use client";

import Image from "next/image";

import style from "./Thread.module.scss";
import { useEffect, useState } from "react";
import { IThread } from "@/interface/Thread.interface";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// const Reply = () => {
//   return (
//     <div className={style.reply}>
//       <Image
//         src={"/images/reply-avatar.svg"}
//         width={45}
//         height={45}
//         alt="Avatar"
//         className="rounded-full"
//       ></Image>
//       <div className={style.content}>
//         <div className="info flex gap-2 items-center">
//           <div className="no font-medium text-[12px]">@11v148</div>
//           <div className="time text-[10px] text-[#BDBDBD] font-extralight">
//             2023/09/19
//           </div>
//         </div>
//         <p className="text-md-dark-green font-extralight text-[12px]">
//           社長什麼時候才會交這個，我好想學喔
//         </p>
//       </div>
//     </div>
//   );
// };

export default function ThreadInfo({ post }: { post: IThread }) {
  const [typeText, setTypeText] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sig, setSig] = useState<any>(null);

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
    <div className={style.info + " box-border rounded-[30px]"}>
      <div className="flex justify-between items-center flex-initial relative">
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
      <div className="mt-5 flex flex-col gap-[40px] overflow-auto">
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

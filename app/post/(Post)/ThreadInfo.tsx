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
  const [like, setLike] = useState<any>(false);

  function Like() {
    setLike(!like);
  }

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
            <div className="text-black opacity-50 max-[900px]:hidden">
              {sig?.name}
            </div>
            <div className={style.time}>
              {new Date(post?.createdAt).toLocaleString().split(" ")[0]}
            </div>
          </div>
          <div
            className="max-h-[64px] my-auto max-[750px]:hidden absolute right-0 top-0 bottom-0 flex items-center justify-center cursor-pointer"
            onClick={Like}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M26.9399 6.38798C26.2047 5.64761 25.3304 5.05985 24.3673 4.65849C23.4042 4.25714 22.3713 4.05012 21.3279 4.04932C19.3543 4.04964 17.4528 4.79101 15.9999 6.12665C14.5471 4.79079 12.6455 4.04938 10.6719 4.04932C9.62728 4.0504 8.59319 4.25806 7.62914 4.66034C6.66509 5.06262 5.79011 5.65158 5.05456 6.39332C1.91723 9.54398 1.91856 14.472 5.05723 17.6093L15.9999 28.552L26.9426 17.6093C30.0812 14.472 30.0826 9.54398 26.9399 6.38798Z"
                fill={like ? "#EE5757" : "#BDBDBD"}
              />
            </svg>
          </div>
        </div>
      </div>
      <div
        className={
          "w-full mt-4 rounded-full border-[#EE5757] h-[50px] items-center justify-center border cursor-pointer hidden max-[750px]:flex select-none " +
          (like ? "bg-[#EE5757]" : "bg-transparent")
        }
        onClick={Like}
      >
        <div
          className={
            "text-center text-[20px] " + (like ? "text-white" : "text-black")
          }
        >
          Like
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

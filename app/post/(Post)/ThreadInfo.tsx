"use client";

import Image from "next/image";

import style from "./Thread.module.scss";
import { useEffect, useState } from "react";

const Reply = () => {
  return (
    <div className={style.reply}>
      <Image
        src={"/images/reply-avatar.svg"}
        width={45}
        height={45}
        alt="Avatar"
        className="rounded-full"
      ></Image>
      <div className={style.content}>
        <div className="info flex gap-2 items-center">
          <div className="no font-medium text-[12px]">@11v148</div>
          <div className="time text-[10px] text-[#BDBDBD] font-extralight">
            2023/09/19
          </div>
        </div>
        <p className="text-md-dark-green font-extralight text-[12px]">
          社長什麼時候才會交這個，我好想學喔
        </p>
      </div>
    </div>
  );
};

const ThreadInfo = () => {
  const [typeText, setTypeText] = useState(false);

  useEffect(() => {});

  return (
    <div className={style.info + " box-border"}>
      <div className="flex justify-between items-center flex-initial">
        <div className={style.author}>
          <Image
            src={
              "https://github.com/banahaker/banahaker.github.io/blob/main/src/assets/logo_bana.png?raw=true"
            }
            width={50}
            height={50}
            alt="Avatar"
            className="rounded-full"
          ></Image>
          <div className="flex flex-col items-start justify-center">
            <div className={style.name}>葉柏辰</div>
            <div className={style.time}>2023/09/19 23:22 </div>
          </div>
        </div>
        <div className="flex">
          <Image
            src={"/icons/bxs-bookmark-star.svg"}
            height={32}
            width={32}
            alt="bookmark"
            className="cursor-pointer"
          ></Image>
          <Image
            src={"/icons/bxs-heart.svg"}
            height={32}
            width={32}
            alt="heart"
            className="cursor-pointer"
          ></Image>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-[40px] overflow-auto">
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
      </div>
      <div className="h-[42px] w-full flex-none bg-[#D5E5E8] rounded-full mt-5 border border-[#BDBDBD] pl-[12px] flex">
        <input
          className="focus-visible:outline-none px-3 w-full h-full bg-transparent flex-1"
          placeholder="Reply..."
          onChange={(e) => {
            e.target.value.length > 0 ? setTypeText(true) : setTypeText(false);
          }}
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
};

export default ThreadInfo;

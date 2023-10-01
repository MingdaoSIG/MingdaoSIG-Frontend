"use client";

import { useState } from "react";
import SplitBlock from "../(Layout)/splitBlock";
import ThreadsList from "./(User)/ThreadsList";
import Image from "next/image";

const user = {
  userId: "1",
  name: "林杰陞",
  code: "11V440",
  email: "11V440@ms.mingdao.edu.tw",
  description:
    "嗨！我是HACO，一位網頁開發者同時也是Lazco團隊的創始人，我在前端和後端開發方面都有豐富的經驗，並且熟練操作包括 JavaScript、Python、PHP、Visual Basic 和 React.js等多種程式語言。憑藉著對網頁開發的熱情和技能，我有信心能夠創造出具有創新性和動感的網站和應用程式，為所有人帶來出色的體驗，我很喜歡交朋友也歡迎大家來我的社群找我喔！對了我也很喜歡出去玩或是參加各種活動，運氣好的話說不定還能遇到我喔！",
};

const SwitchButton = ({ callback }: { callback: Function }) => {
  const [buttonStyle, setButtonStyle] = useState("left-0");
  const [leftStyle, setLeftStyle] = useState(
    "py-4 w-[100px] text-center duration-500 relative text-white"
  );
  const [rightStyle, setRightStyle] = useState(
    "py-4 w-[100px] text-center duration-500 relative text-md-dark-green"
  );

  return (
    <div className="ml-[10px] flex bg-white bg-opacity-50 rounded-full mb-4 relative">
      <div
        className={`transition-all duration-500 w-[100px] h-[56px] absolute bg-md-dark-green rounded-full ${buttonStyle}`}
      ></div>
      <button
        className={leftStyle}
        onClick={() => {
          setButtonStyle("left-0");
          callback(0);
          setLeftStyle(
            "py-4 w-[100px] text-center duration-500 relative text-white"
          );
          setRightStyle(
            "py-4 w-[100px] text-center duration-500 relative text-md-dark-green"
          );
        }}
      >
        Posts
      </button>
      <button
        className={rightStyle}
        onClick={() => {
          setButtonStyle("left-[100px]");
          callback(1);
          setLeftStyle(
            "py-4 w-[100px] text-center duration-500 relative text-md-dark-green"
          );
          setRightStyle(
            "py-4 w-[100px] text-center duration-500 relative text-white"
          );
        }}
      >
        Likes
      </button>
    </div>
  );
};

export default function UserPage({ params }: { params: { userID: string } }) {
  const UserID = decodeURIComponent(params.userID).toLocaleUpperCase();

  const [listType, setListType] = useState(0);

  return (
    <SplitBlock>
      <div className="flex flex-col items-start">
        <SwitchButton callback={setListType}></SwitchButton>
        <ThreadsList />
      </div>
      <div className="flex flex-col h-full relative">
        <div className="flex-initial h-1/3 bg-[linear-gradient(253deg,_#0057BD_0%,_#97E6FF_100%)]"></div>
        <div className="flex flex-col h-2/3 bg-white py-2 items-stretch">
          <div className="mt-[70px] ml-10">
            <div className="text-[#002024] font-normal text-[24px]">
              {user?.name}
            </div>
            <div className="text-[#006180] font-normal text-[14px]">
              {UserID}
            </div>
          </div>
          <div className="my-5 mx-10 h-[60%] overflow-y-scroll px-1">
            <p>{user?.description}</p>
          </div>
        </div>
        <div className="h-[120px] w-[120px] bg-white flex-none absolute top-1/4 left-10 rounded-full">
          <Image
            src="/images/haco-avatar.webp"
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

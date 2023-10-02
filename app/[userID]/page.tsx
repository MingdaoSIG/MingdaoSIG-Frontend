"use client";

import { useEffect, useState } from "react";
import SplitBlock from "../(Layout)/splitBlock";
import ThreadsList from "./(User)/ThreadsList";
import Image from "next/image";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  const route = useRouter();

  const [status, setStatus] = useState("loading");
  const [listType, setListType] = useState(0);
  const [user, setUser] = useState({ name: "", description: "", avatar: "" });

  useEffect(() => {
    GetUserAPI();

    async function GetUserAPI() {
      try {
        const res = await (
          await fetch(`${API_URL}/profile/user/${UserID}`, {
            method: "GET",
          })
        ).json();
        if (res.status === 4100) {
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
  }, [UserID]);

  if (status === "loading") {
    return <div className="flex m-auto text-[50px]">Loading...</div>;
  } else if (status === "success") {
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
  } else if (status === "notfound") {
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
  }
}

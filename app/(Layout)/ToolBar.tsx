"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const menu = { home: "/", user: "/@", new: "/new", hash: "/#" };

const ToolBar = () => {
  const [userID, setUserID] = useState("/");
  const pathname = usePathname();
  const route = useRouter();

  useEffect(() => {
    const _localStorage: any = JSON.parse(
      localStorage.getItem("User")?.toString() || "{}"
    );
    setUserID(_localStorage.customId);
  }, []);
  return (
    <div className="h-[5rem] w-[25rem] bg-white bg-opacity-50 mx-auto rounded-full border-white border-opacity-60 border">
      <div className="h-full w-[22em] mx-auto flex">
        <div
          className={
            "flex-1 my-auto bg-slate-400 rounded-full py-2 " +
            (pathname === menu.home ? "bg-opacity-30" : "bg-opacity-0")
          }
          onClick={() => {
            route.push("/");
          }}
        >
          <Image
            src={"/icons/bx-home-circle.svg"}
            height={32}
            width={32}
            alt="home"
            className="cursor-pointer mx-auto"
          ></Image>
        </div>
        <div
          className={
            "flex-1 my-auto bg-slate-400 rounded-full py-2 " +
            (pathname.startsWith(menu.user) ? "bg-opacity-30" : "bg-opacity-0")
          }
          onClick={() => {
            route.push("/@" + userID);
          }}
        >
          <Image
            src={"/icons/bx-user.svg"}
            height={32}
            width={32}
            alt="user"
            className="cursor-pointer mx-auto"
          ></Image>
        </div>
        <div
          className={
            "flex-1 my-auto bg-slate-400 rounded-full py-2 " +
            (pathname.startsWith(menu.new) ? "bg-opacity-30" : "bg-opacity-0")
          }
          onClick={() => {
            route.push("/new");
          }}
        >
          <Image
            src={"/icons/plus-circle.svg"}
            height={32}
            width={32}
            alt="ring"
            className="cursor-pointer mx-auto"
          ></Image>
        </div>
        <div
          className={
            "flex-1 my-auto bg-slate-400 rounded-full py-2 " +
            (pathname.startsWith(menu.hash) ? "bg-opacity-30" : "bg-opacity-0")
          }
          onClick={() => {
            route.push("/hashtag");
          }}
        >
          <Image
            src={"/icons/hash.svg"}
            height={32}
            width={32}
            alt="menu"
            className="cursor-pointer mx-auto"
          ></Image>
        </div>
      </div>
    </div>
  );
};

export default ToolBar;

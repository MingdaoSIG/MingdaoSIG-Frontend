"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

const menu = { home: "/", user: "/user", ring: "notify", menu: "/menu" };

const ToolBar = () => {
  const pathname = usePathname();
  console.log(pathname);
  return (
    <div className="w-full absolute bottom-[64px] select-none">
      <div className="h-[90px] w-[484px] bg-white bg-opacity-50 mx-auto rounded-full border-white border-opacity-60 border">
        <div className="h-full w-[350px] mx-auto flex">
          <div
            className={
              "flex-1 my-auto bg-slate-400 rounded-full py-2 " +
              (pathname.startsWith(menu["home"])
                ? "bg-opacity-30"
                : "bg-opacity-0")
            }
          >
            <Image
              src={"/icons/bx-home-circle.svg"}
              height={32}
              width={32}
              alt="home"
              className="cursor-pointer mx-auto"
            ></Image>
          </div>
          <div className="flex-1 my-auto">
            <Image
              src={"/icons/bx-user.svg"}
              height={32}
              width={32}
              alt="user"
              className="cursor-pointer mx-auto"
            ></Image>
          </div>
          <div className="flex-1 my-auto">
            <Image
              src={"/icons/bxs-bell-ring.svg"}
              height={32}
              width={32}
              alt="ring"
              className="cursor-pointer mx-auto"
            ></Image>
          </div>
          <div className="flex-1 my-auto">
            <Image
              src={"/icons/bx-menu-alt-right.svg"}
              height={32}
              width={32}
              alt="menu"
              className="cursor-pointer mx-auto"
            ></Image>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolBar;

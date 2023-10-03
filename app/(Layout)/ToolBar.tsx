"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const menu = [
  {
    name: "home",
    path: "/",
    icon: "/icons/bx-home-circle.svg",
  },
  {
    name: "user",
    path: "/@",
    icon: "/icons/bx-user.svg",
  },
  {
    name: "new",
    path: "/new",
    icon: "/icons/plus-circle.svg",
  },
  {
    name: "hash",
    path: "/#",
    icon: "/icons/hash.svg",
  },
];

const ToolBar = () => {
  const [userID, setUserID] = useState("/");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const _localStorage: any = JSON.parse(
      localStorage.getItem("User")?.toString() || "{}"
    );
    setUserID(_localStorage.customId);
  }, []);

  console.log(pathname);

  return (
    <div className="h-[5rem] w-[25rem] bg-white bg-opacity-50 mx-auto rounded-full border-white border-opacity-60 border">
      <div className="h-full w-[22em] mx-auto flex">
        {menu.map((item, index) => {
          console.log(item.path, pathname !== "/");
          return (
            <div
              key={index}
              className={
                "flex-1 my-auto  rounded-full bg-slate-400 py-2 transition-opacity duration-500" +
                ((pathname != "/" && pathname.startsWith(item.path)) ||
                pathname === item.path
                  ? " bg-opacity-30"
                  : " bg-opacity-0")
              }
              onClick={() => {
                if (item.path.startsWith("/@")) router.push("/@" + userID);
                else router.push(item.path);
              }}
            >
              <Image
                src={item.icon}
                height={32}
                width={32}
                alt={item.name}
                className="cursor-pointer mx-auto"
              ></Image>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToolBar;

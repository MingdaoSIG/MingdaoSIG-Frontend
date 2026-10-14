"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useUserAccount } from "@/utils/useUserAccount";

const ToolBar = () => {
  const { isLogin, userData, isLoading } = useUserAccount();

  const path = usePathname();
  const [selected, setSelected] = useState<0 | 1 | 2 | 3 | -1 | number>(
    pathToSelected(path),
  );

  useEffect(() => {
    setSelected(pathToSelected(path));
  }, [path]);

  const menu = [
    {
      name: "home",
      route: "/",
      icon: "/icons/bx-home-circle.svg",
      clickable: !isLoading && true,
    },
    {
      name: "user",
      route: userData ? `/@${userData.customId}` : "/",
      icon: "/icons/bx-user.svg",
      clickable: !isLoading && isLogin,
    },
    {
      name: "new",
      route: "/new",
      icon: "/icons/plus-circle.svg",
      clickable: !isLoading && true,
    },
    {
      name: "info",
      route: "/info",
      icon: "/icons/info.svg",
      clickable: !isLoading && true,
    },
  ];

  // 計算選中項目的 left 位置 (rem)
  const getSelectedPosition = () => {
    if (selected === -1) {
      return "0rem";
    }
    // 18.8rem / 4 = 4.7rem per item
    return `${selected * 4.7}rem`;
  };

  return (
    <nav
      data-shell="dock"
      aria-label="主要導覽"
      className="glass fixed bottom-5 left-1/2 z-40 flex h-16 w-80 -translate-x-1/2 select-none items-center justify-center rounded-[18px] bg-white/72"
    >
      <div className="relative flex h-12 w-[18.8rem]">
        {menu.map((item, index) => {
          return (
            <div
              key={item.name}
              className="relative z-10 flex flex-1 items-center justify-center rounded-xl"
            >
              <div
                style={{
                  cursor: item.clickable ? "pointer" : "not-allowed",
                }}
                className="absolute inset-0 rounded-xl"
              />
              <Link
                href={item.route}
                style={{
                  opacity: item.clickable ? 1 : 0.5,
                  pointerEvents: item.clickable ? "auto" : "none",
                }}
                className="relative flex cursor-pointer items-center justify-center rounded-xl transition-opacity duration-500"
                onClick={() => setSelected(index)}
                aria-label={item.name}
              >
                <Image src={item.icon} height={26} width={26} alt="" />
              </Link>
            </div>
          );
        })}
        <div
          style={{
            display: selected === -1 ? "none" : "block",
            left: getSelectedPosition(),
          }}
          className="absolute h-full w-[4.7rem] rounded-xl bg-brand-700/12 transition-all duration-300 ease-in-out"
        />
      </div>
    </nav>
  );
};

export default ToolBar;

function pathToSelected(path: string) {
  const homeRegex = /^\/$/gm;
  const userRegex = /^\/@(?!$)(?=.{1,25}$)[a-z0-9_]+(\.[a-z0-9_]+)*$/gm;
  const newRegex = /^\/new$/gm;
  const infoRegex = /^\/info$/gm;

  if (homeRegex.test(path)) {
    return 0;
  }
  if (userRegex.test(path)) {
    return 1;
  }
  if (newRegex.test(path)) {
    return 2;
  }
  if (infoRegex.test(path)) {
    return 3;
  }

  return -1;
}

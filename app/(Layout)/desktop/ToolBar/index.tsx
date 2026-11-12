"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useUserAccount } from "@/utils/useUserAccount";
import { selectedTab } from "../../selectedTab";

const ToolBar = () => {
  const { isLogin, userData, isLoading, login } = useUserAccount();

  const path = usePathname();
  const ownCustomId = userData?.customId ?? null;
  const [selected, setSelected] = useState<number>(() =>
    selectedTab(path, ownCustomId),
  );

  useEffect(() => {
    setSelected(selectedTab(path, ownCustomId));
  }, [path, ownCustomId]);

  const menu = [
    {
      name: "home",
      label: "首頁",
      route: "/",
      icon: "/icons/bx-home-circle.svg",
    },
    {
      name: "user",
      label: "個人頁面",
      route: ownCustomId ? `/@${ownCustomId}` : "/",
      icon: "/icons/bx-user.svg",
    },
    {
      name: "new",
      label: "發文",
      route: "/new",
      icon: "/icons/plus-circle.svg",
    },
    {
      name: "info",
      label: "平台資訊",
      route: "/info",
      icon: "/icons/info.svg",
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
          // Your profile needs the login state; until it is known the
          // item waits, and logged out it starts the login.
          const waiting = item.name === "user" && isLoading;
          return (
            <Link
              key={item.name}
              href={item.route}
              aria-label={item.label}
              title={item.label}
              aria-current={selected === index ? "page" : undefined}
              aria-disabled={waiting || undefined}
              style={{ opacity: waiting ? 0.5 : 1 }}
              className={`relative z-10 flex flex-1 items-center justify-center rounded-xl transition-opacity duration-500 ${
                waiting ? "cursor-wait" : "cursor-pointer"
              }`}
              onClick={(e) => {
                if (waiting) {
                  e.preventDefault();
                  return;
                }
                if (item.name === "user" && !isLogin) {
                  e.preventDefault();
                  login();
                  return;
                }
                setSelected(index);
              }}
            >
              <Image src={item.icon} height={26} width={26} alt="" />
            </Link>
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

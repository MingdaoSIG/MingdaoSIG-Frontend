"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useUserAccount } from "@/utils/useUserAccount";
import styles from "./ToolBar.module.scss";

const ToolBar = () => {
  const { isLogin, userData, isLoading } = useUserAccount();

  const path = usePathname();
  const [selected, setSelected] = useState<0 | 1 | 2 | 3 | number>(
    pathToSelected(path)
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
      clickable: !isLoading && isLogin,
    },
    {
      name: "info",
      route: "/info",
      icon: "/icons/info.svg",
      clickable: !isLoading && true,
    },
  ];

  return (
    <div className={styles.toolBarWrapper}>
      <div className={styles.iconWrapper}>
        {menu.map((item, index) => {
          return (
            <div 
              key={index} 
              className={styles.iconBackground} 
            >
              <div 
                className={styles.icon}
                style={{
                  backgroundColor: (selected === (index)) ? "rgba(148, 163, 184, 0.3)" : "rgba(255, 255, 255, 1)"
                }}
              >
                <Link
                  href={item.route}
                  style={{
                    opacity: item.clickable ? 1 : 0.5,
                    pointerEvents: item.clickable ? "auto" : "none",
                  }}
                  className={styles.icon}
                  onClick={() => setSelected(index)}
                >
                  <Image
                    src={item.icon}
                    height={25}
                    width={25}
                    alt={item.name}
                  ></Image>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
  } else if (userRegex.test(path)) {
    return 1;
  } else if (newRegex.test(path)) {
    return 2;
  } else if (infoRegex.test(path)) {
    return 3;
  }

  return -1;
}

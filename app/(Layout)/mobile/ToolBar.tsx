"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "./ToolBar.module.scss";

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

  const menu = [
    {
      name: "home",
      path: "/",
      route: "/",
      icon: "/icons/bx-home-circle.svg",
      clickable: true,
    },
    {
      name: "user",
      path: "/@",
      route: `/@${userID}`,
      icon: "/icons/bx-user.svg",
      clickable: false,
    },
    {
      name: "new",
      path: "/new",
      route: "/new",
      icon: "/icons/plus-circle.svg",
      clickable: true,
    },
    {
      name: "hash",
      path: "/#",
      route: "/hashtag",
      icon: "/icons/hash.svg",
      clickable: true,
    },
  ];

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarInner}>
        {menu.map((item, index) => {
          if (item.path === "/") {
            return (
              <button
                key={index}
                className={
                  "flex-1 my-auto rounde rounded-full bg-slate-400 py-2 transition-opacity duration-500 cursor-pointer" +
                  (pathname === "/" ? " bg-opacity-30" : " bg-opacity-0")
                }
                onClick={() => {
                  route.push(item.route);
                }}
              >
                <Image
                  src={item.icon}
                  height={32}
                  width={32}
                  alt={item.name}
                  className="mx-auto"
                ></Image>
              </button>
            );
          } else {
            return (
              <button
                key={index}
                className={
                  "flex-1 my-auto rounded-full bg-slate-400 py-2 transition-opacity duration-500 disabled:opacity-40 " +
                  (pathname.startsWith(item.path) && userID
                    ? "bg-opacity-30 "
                    : "bg-opacity-0 ") +
                  (!userID && !item.clickable
                    ? "cursor-not-allowed"
                    : "cursor-pointer")
                }
                onClick={() => {
                  route.push(item.route);
                }}
                disabled={!userID && !item.clickable}
              >
                <Image
                  src={item.icon}
                  height={32}
                  width={32}
                  alt={item.name}
                  className="mx-auto"
                ></Image>
              </button>
            );
          }
        })}
      </div>
    </div>
  );
};

export default ToolBar;

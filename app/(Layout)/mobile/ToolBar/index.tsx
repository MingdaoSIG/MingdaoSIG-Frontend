"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { TapScaleLink } from "@/components/mobile/TapScale";
import { useUserAccount } from "@/utils/useUserAccount";
import styles from "./ToolBar.module.scss";

const ToolBar = () => {
  const { isLogin, userData, isLoading } = useUserAccount();

  const path = usePathname();
  const [selected, setSelected] = useState<number>(pathToSelected(path));

  useEffect(() => {
    setSelected(pathToSelected(path));
  }, [path]);

  const menu = [
    {
      name: "home",
      label: "Home",
      route: "/",
      icon: "/icons/bx-home-circle.svg",
      clickable: !isLoading,
    },
    {
      name: "user",
      label: "You",
      route: userData ? `/@${userData.customId}` : "/",
      icon: "/icons/bx-user.svg",
      clickable: !isLoading && isLogin,
    },
    {
      name: "new",
      label: "Post",
      route: "/new",
      icon: "/icons/plus-circle.svg",
      clickable: !isLoading,
    },
    {
      name: "info",
      label: "Info",
      route: "/info",
      icon: "/icons/info.svg",
      clickable: !isLoading,
    },
  ];

  return (
    <nav className={styles.toolBarWrapper} aria-label="Primary">
      <ul className={styles.tabList}>
        {menu.map((item, index) => {
          const isActive = selected === index;
          return (
            <li key={item.name} className={styles.tabItem}>
              <TapScaleLink
                href={item.route}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                style={{
                  opacity: item.clickable ? 1 : 0.4,
                  pointerEvents: item.clickable ? "auto" : "none",
                }}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={!item.clickable || undefined}
                tabIndex={item.clickable ? undefined : -1}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={(e) => {
                  if (!item.clickable) {
                    e.preventDefault();
                    return;
                  }
                  if (isActive) {
                    window.dispatchEvent(
                      new CustomEvent("mobile:scroll-to-top"),
                    );
                  }
                  setSelected(index);
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-indicator"
                    className={styles.activeIndicator}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <Image
                  src={item.icon}
                  height={24}
                  width={24}
                  alt=""
                  aria-hidden="true"
                />
                <span className={styles.label}>{item.label}</span>
              </TapScaleLink>
            </li>
          );
        })}
      </ul>
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

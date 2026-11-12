"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { TapScaleLink } from "@/components/mobile/TapScale";
import { useAdminChrome } from "@/utils/useAdminAccess";
import { useUserAccount } from "@/utils/useUserAccount";
import { selectedTab } from "../../selectedTab";
import styles from "./ToolBar.module.scss";

const ToolBar = () => {
  const { isLogin, userData, isLoading, login } = useUserAccount();

  const path = usePathname();
  const { hideDock } = useAdminChrome();
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
      label: "Home",
      route: "/",
      icon: "/icons/bx-home-circle.svg",
      clickable: true,
    },
    {
      name: "user",
      label: "You",
      route: ownCustomId ? `/@${ownCustomId}` : "/",
      icon: "/icons/bx-user.svg",
      // Logged out, tapping it starts the login.
      clickable: !isLoading,
    },
    {
      name: "new",
      label: "Post",
      route: "/new",
      icon: "/icons/plus-circle.svg",
      clickable: true,
    },
    {
      name: "info",
      label: "Info",
      route: "/info",
      icon: "/icons/info.svg",
      clickable: true,
    },
  ];

  // The admin panel has its own section switcher and 「回到網站」.
  if (hideDock) {
    return null;
  }

  return (
    <nav className={styles.toolBarWrapper} aria-label="主要導覽">
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
                  if (item.name === "user" && !isLogin) {
                    e.preventDefault();
                    login();
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

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useUserAccount } from "@/utils/useUserAccount";
import styles from "./ToolBar.module.scss";

const ToolBar = () => {
  const { isLogin, userData, isLoading } = useUserAccount();

  const path = usePathname();
  const [selected, setSelected] = useState<0 | 1 | 2 | 3 | -1 | number>(pathToSelected(path));

  useEffect(() => {
    setSelected(pathToSelected(path));
  }, [path]);

  const menu = [
    {
      name: "home",
      route: "/",
      icon: "/icons/bx-home-circle.svg",
      clickable: !isLoading && true
    },
    {
      name: "user",
      route: userData ? `/@${userData.customId}` : "/",
      icon: "/icons/bx-user.svg",
      clickable: !isLoading && isLogin
    },
    {
      name: "new",
      route: "/new",
      icon: "/icons/plus-circle.svg",
      clickable: !isLoading && isLogin
    },
    {
      name: "hash",
      route: "/hashtag",
      icon: "/icons/hash.svg",
      clickable: !isLoading && true
    },
  ];

  return (
    <div className={styles.toolBarWrapper}>
      <div className={styles.iconWrapper}>
        {menu.map((item, index) => {
          return (
            <div
              key={index}
              className={styles.icon}
            >
              <div
                style={{
                  cursor: item.clickable ? "pointer" : "not-allowed"
                }}
                className={styles.iconCursor}
              />
              <Link
                href={item.route}
                style={{
                  opacity: item.clickable ? 1 : 0.5,
                  pointerEvents: item.clickable ? "auto" : "none"
                }}
                className={styles.icon}
                onClick={() => setSelected(index)}
              >
                <Image
                  src={item.icon}
                  height={32}
                  width={32}
                  alt={item.name}
                ></Image>
              </Link>
            </div>
          );
        })}
        <div
          style={{
            display: selected === -1 ? "none" : "block",
            left: `${selected / 4 * 100}%`
          }}
          className={styles.selected}
        />
      </div>
    </div>
  );
};

export default ToolBar;

function pathToSelected(path: string) {
  const homeRegex = /^\/$/gm;
  const userRegex = /^\/@(?!$)(?=.{1,25}$)[a-z0-9_]+(\.[a-z0-9_]+)*$/gm;
  const newRegex = /^\/new$/gm;
  const hashRegex = /^\/hashtag$/gm;

  if (homeRegex.test(path)) {
    return 0;
  } else if (userRegex.test(path)) {
    return 1;
  } else if (newRegex.test(path)) {
    return 2;
  } else if (hashRegex.test(path)) {
    return 3;
  }

  return -1;
}
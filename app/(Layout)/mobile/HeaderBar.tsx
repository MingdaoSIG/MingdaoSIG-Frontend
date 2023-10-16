"use client";

import styles from "./headerbar.module.scss";
import UserLogin from "./UserLogin";
import Image from "next/image";

import { useRouter } from "next/navigation";

const HeaderBar = () => {
  const router = useRouter();

  return (
    <>
      <div className={styles.nav}>
        <Image
          src="/images/logo_mobile.png"
          alt="Logo"
          width={60}
          height={60}
          priority
          className="h-16 hover:cursor-pointer"
          onClick={() => router.push("/")}
        />
        <UserLogin />
      </div>
    </>
  );
};

export default HeaderBar;

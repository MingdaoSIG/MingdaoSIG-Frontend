"use client";

import styles from "./HeaderBar.module.scss";
import UserLogin from "./UserLogin";
// import Image from "next/image";

import { useRouter } from "next/navigation";

const HeaderBar = () => {
  const router = useRouter();

  return (
    <div className={styles.nav}>
      <img 
        src="/images/logo_mobile_v2.svg"
        alt="Logo" 
        className={styles.logo}
        onClick={() => router.push("/")}
      />
      {/* <Image
        src="/images/logo_mobile_v2.svg"
        alt="Logo"
        width={60}
        height={60}
        priority
        className={styles.logo}
        onClick={() => router.push("/")}
      /> */}
      <UserLogin />
    </div>
  );
};

export default HeaderBar;

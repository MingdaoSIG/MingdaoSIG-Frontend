"use client";

import styles from "./HeaderBar.module.scss";
import UserLogin from "./UserLogin";

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
      <UserLogin />
    </div>
  );
};

export default HeaderBar;

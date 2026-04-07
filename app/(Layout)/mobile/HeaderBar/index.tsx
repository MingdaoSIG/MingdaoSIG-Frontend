"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./HeaderBar.module.scss";
import UserLogin from "./UserLogin";

const HeaderBar = () => {
  const router = useRouter();

  return (
    <div className={styles.nav}>
      <Image
        src="/images/logo_mobile_v2.svg"
        alt="Logo"
        width={64}
        height={32}
        unoptimized
        className={styles.logo}
        onClick={() => router.push("/")}
      />
      <UserLogin />
    </div>
  );
};

export default HeaderBar;

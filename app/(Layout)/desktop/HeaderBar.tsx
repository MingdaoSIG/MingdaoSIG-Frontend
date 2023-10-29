"use client";

import Link from "next/link";
import style from "./Headerbar.module.scss";
import UserLogin from "./UserLogin";
import Image from "next/image";

import { useRouter } from "next/navigation";

const HeaderBar = () => {
  const router = useRouter();

  return (
    <>
      <div className={style.nav}>
        <Link href={"/"}>
          <Image
            src="/images/logo.svg"
            alt="Logo"
            width={214}
            height={46}
            priority
          />
        </Link>
        <UserLogin />
      </div>
    </>
  );
};

export default HeaderBar;

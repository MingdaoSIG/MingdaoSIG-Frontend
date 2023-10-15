"use client";

import style from "./headerbar.module.scss";
import UserLogin from "./UserLogin";
import Image from "next/image";

import { useRouter } from "next/navigation";

const HeaderBar = () => {
  const router = useRouter();

  return (
    <>
      <div className={style.nav}>
        <Image
          src="/images/logo.svg"
          alt="Logo"
          width={214}
          height={46}
          priority
          className="my-auto hover:cursor-pointer"
          onClick={() => router.push("/")}
        />
        <UserLogin />
      </div>
    </>
  );
};

export default HeaderBar;

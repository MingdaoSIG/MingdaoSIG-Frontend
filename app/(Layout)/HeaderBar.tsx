"use client";

import style from "@/app/(Layout)/headerbar.module.scss";
import UserLogin from "@/app/(Layout)/Header/UserLogin";
import ModeToggleButton from "@/app/(Layout)/Header/ModeToggleButton";
import Image from "next/image";

import { useRouter } from "next/navigation";

const HeaderBar = () => {
  const router = useRouter();

  return (
    <>
      <div className={style.nav + " relative"}>
        <div
          className={style.logo + " hover:cursor-pointer"}
          onClick={() => router.push("/")}
        >
          <Image
            src="/images/logo.svg"
            alt="Logo"
            width={214}
            height={46}
            priority
          />
        </div>
        <div className="relative">
          <ModeToggleButton />
          <UserLogin />
        </div>
      </div>
    </>
  );
};

export default HeaderBar;

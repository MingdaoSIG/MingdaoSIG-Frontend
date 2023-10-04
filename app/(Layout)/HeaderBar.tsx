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
        <div className={style.logo + " my-auto w-[35dvw] h-[65px] flex"}>
          <div className="my-auto w-auto ml-[100px]">
            <Image
              src="/images/logo.svg"
              alt="Logo"
              width={214}
              height={46}
              priority
              className="my-auto hover:cursor-pointer"
              onClick={() => router.push("/")}
            />
          </div>
        </div>
        <div className="flex relative max-h-[60px]">
          <ModeToggleButton />
          <UserLogin />
        </div>
      </div>
    </>
  );
};

export default HeaderBar;

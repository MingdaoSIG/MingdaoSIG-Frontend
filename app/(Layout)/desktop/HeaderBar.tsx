"use client";

import style from "@/app/(Layout)/desktop/headerbar.module.scss";
import UserLogin from "./UserLogin";
import Image from "next/image";

import { useRouter } from "next/navigation";

const HeaderBar = () => {
  const router = useRouter();

  return (
    <>
      <div className={style.nav}>
        <div className={style.logo}>
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
          {/* <ModeToggleButton /> */}
          <UserLogin />
        </div>
      </div>
    </>
  );
};

export default HeaderBar;

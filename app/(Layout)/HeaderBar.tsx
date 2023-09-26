"use client";

import style from "@/app/(Layout)/headerbar.module.scss";
import UserLogin from "@/app/(Layout)/Header/UserLogin";

import { useRouter } from "next/navigation";

const HeaderBar = () => {
  const router = useRouter();

  return (
    <>
      <div className={style.nav}>
        <div
          className={style.logo + " hover:cursor-pointer"}
          onClick={() => router.push("/")}
        >
          <span className="text-md-light-green">MD</span>SIG
        </div>
        <UserLogin />
      </div>
    </>
  );
};

export default HeaderBar;

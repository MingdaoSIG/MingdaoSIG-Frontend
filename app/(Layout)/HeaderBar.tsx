"use client";

import style from "./headerbar.module.scss";
import Image from "next/image";

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
        <div className={style.userPanel}>
          <div className="avatar">
            <Image
              src={
                "https://github.com/banahaker/banahaker.github.io/blob/main/src/assets/logo_bana.png?raw=true"
              }
              width={50}
              height={50}
              alt="Avatar"
            ></Image>
          </div>
          <div className={style.user}>
            <p className="name text-md-dark-green text-[20px] leading-6 font-bold">
              葉柏辰
            </p>
            <p className="text-[#006180] text-[12px] leading-3	">
              11s505@ms.mingdao.edu.tw
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeaderBar;

"use client";

import style from "@/app/(Layout)/headerbar.module.scss";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

import { useRouter } from "next/navigation";

const UserLogin = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === "unauthenticated") {
    return (
      <div
        className={"text-center hover:cursor-pointer"}
        onClick={() => signIn("google")}
      >
        登入
      </div>
    );
  } else if (status === "authenticated") {
    return (
      <div className={style.userPanel} onClick={() => signOut()}>
        <div className="avatar">
          <Image
            src={session?.user?.image ?? ""}
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
            {session?.user?.email}
          </p>
        </div>
      </div>
    );
  }
};

export default UserLogin;

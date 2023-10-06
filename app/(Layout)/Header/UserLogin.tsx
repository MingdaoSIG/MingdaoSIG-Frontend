"use client";

import style from "@/app/(Layout)/Header/userlogin.module.scss";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const UserLogin = () => {
  const [isLogin, setIsLogin] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") return;
    if (status === "authenticated") {
      if (!localStorage.getItem("User")) {
        LoginAPI();
      } else {
        setIsLogin(true);
      }
    }
    async function LoginAPI() {
      try {
        const _session: any = session;

        var urlencoded = new URLSearchParams();
        urlencoded.append("googleToken", _session?.accessToken);
        const res = await (
          await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: urlencoded,
          })
        ).json();
        localStorage.setItem(
          "UserID",
          res.authorization.toString().split(" ")[1]
        );
        localStorage.setItem("User", JSON.stringify(res.data));
        setIsLogin(true);
        return;
      } catch (error) {
        console.log(error);
      }
    }
  }, [session, status]);

  if (status === "loading") {
    return (
      <div className="w-[250px] h-[60px] rounded-full itmes-center bg-[linear-gradient(to_right,_#6FA8FF,_#003F47)] flex absolute right-[5dvw] select-none ">
        <div
          className={
            "flex m-auto text-center hover:cursor-pointer " +
            style.loginUserPanel
          }
          onClick={() => signIn("google")}
        >
          <p className="m-auto text-[#004C64] font-medium">Loading...</p>
        </div>
      </div>
    );
  } else if (!isLogin) {
    return (
      <div className="w-[250px] h-[60px] rounded-full itmes-center bg-[linear-gradient(to_right,_#6FA8FF,_#003F47)] flex absolute right-[5dvw] select-none ">
        <div
          className={
            "flex m-auto text-center hover:cursor-pointer " +
            style.loginUserPanel
          }
          onClick={() => signIn("google")}
        >
          <p className="m-auto text-[#004C64] font-medium">Login</p>
        </div>
      </div>
    );
  } else {
    const user = JSON.parse(localStorage.User || "{}");
    return (
      <div
        className={style.userPanel + " select-none"}
        onClick={() => {
          signOut();
          localStorage.clear();
        }}
      >
        <div className="avatar">
          <Image
            src={user.avatar}
            width={50}
            height={50}
            alt="Avatar"
            className="ml-1"
          ></Image>
        </div>
        <div className={style.user}>
          <p className="name text-md-dark-green text-[20px] leading-6 font-bold">
            {user.name}
          </p>
          <p className="text-[#006180] text-[12px] leading-3	">{user.email}</p>
        </div>
      </div>
    );
  }
};

export default UserLogin;

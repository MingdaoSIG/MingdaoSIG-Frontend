"use client";

import style from "@/app/(Layout)/Header/userlogin.module.scss";
import axios from "axios";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

const UserLogin = () => {
  const [loadTime, setLoadTime] = useState(0);
  const [isLogin, setIsLogin] = useState(false);
  const { data: session } = useSession();
  useEffect(() => {
    if (session === null || session === undefined) {
      localStorage.clear();
      return;
    }

    async function LoginAPI() {
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_LOCAL_API_URL}/login`,
          {
            email: session?.user?.email,
            avatar: session?.user?.image,
          }
        );
        localStorage.setItem(
          "UserID",
          res.data.authorization.toString().split(" ")[1]
        );
        localStorage.setItem("User", JSON.stringify(res.data.data));
        return res.data;
      } catch (error) {
        console.log(error);
      }
    }

    if (loadTime === 0) {
      ("");
      LoginAPI();
      setLoadTime(1);
    }

    // localStorage.setItem("UserToken", response?.headers?.authorization);
    setIsLogin(true);
  }, [loadTime, session]);

  if (!isLogin) {
    return (
      <div className="w-[230px] h-[60px] rounded-full itmes-center bg-[linear-gradient(to_right,_#6FA8FF,_#003F47)] flex">
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
    const user = JSON.parse(localStorage.getItem("User") ?? "");
    return (
      <div
        className={style.userPanel}
        onClick={() => {
          signOut();
          localStorage.clear();
        }}
      >
        <div className="avatar">
          <Image src={user.avatar} width={50} height={50} alt="Avatar"></Image>
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

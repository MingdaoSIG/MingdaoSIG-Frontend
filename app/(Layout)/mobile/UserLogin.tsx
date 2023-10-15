import style from "./userlogin.module.scss";
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

  if (status !== "loading" && isLogin) {
    const user = JSON.parse(localStorage.User || "{}");
    return (
      <div
        className={style.userPanel}
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
      </div>
    );
  }

  return (
    <div className={style.loginUserPanelWrap}>
      <div
        className={style.loginUserPanel}
        onClick={
          !isLogin
            ? () => signIn("google")
            : () => {
              return;
            }
        }
      >
        {!isLogin ? (
          <p className="m-auto text-[#004C64] font-medium">Login</p>
        ) : (
          <p className="m-auto text-[#004C64] font-medium">Loading...</p>
        )}
      </div>
    </div>
  );
};

export default UserLogin;

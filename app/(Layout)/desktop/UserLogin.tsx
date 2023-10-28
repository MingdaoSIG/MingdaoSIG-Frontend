import style from "@/app/(Layout)/desktop/userlogin.module.scss";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UserLogin() {
  const [isLogin, setIsLogin] = useState(false);
  const { data: session, status } = useSession();
  const [cookie, setCookie, removeCookie] = useCookies(["confirmed_1"]);
  const route = useRouter();

  useEffect(() => {
    if (isLogin) {
      const userData = JSON.parse(localStorage.getItem("User") || "{}");
      if (userData?.badge && userData?.badge.includes("10.21_user")) {
        if (!cookie.confirmed_1) {
          Swal.fire({
            title: "Thanks for coming to school anniversary 😁",
            text: "Checkout your awesome badge!",
            icon: "info",
            confirmButtonText: "Bring me there!",
            showCancelButton: true,
            cancelButtonText: "Do not show again",
          }).then((result) => {
            if (result.isConfirmed) {
              route.push(`/@${userData.customId}`);
            }
            setCookie("confirmed_1", true, { path: "/" });
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookie.confirmed_1, isLogin]);

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
          "token",
          res.authorization.toString().split(" ")[1]
        );
        localStorage.setItem("User", JSON.stringify(res.data));
        setIsLogin(true);
        return;
      } catch (error) {
        logout();
        console.log(error);
      }
    }
  }, [session, status]);

  if (status === "loading") {
    return (
      <div className="w-[250px] h-[60px] rounded-full items-center bg-[linear-gradient(to_right,_#6FA8FF,_#003F47)] flex absolute right-[5dvw] select-none ">
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
      <div className="w-[250px] h-[60px] rounded-full items-center bg-[linear-gradient(to_right,_#6FA8FF,_#003F47)] flex absolute right-[5dvw] select-none ">
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
        className={style.userPanel + " select-none cursor-pointer"}
        onClick={async () => {
          await Swal.fire({
            text: "Are you sure you want to logout?",
            icon: "question",
            showCancelButton: true,
            cancelButtonText: "Cancel",
            confirmButtonText: "Logout me out now",
            confirmButtonColor: "#DC0032",
          }).then((result) => {
            if (result.isConfirmed) {
              logout();
            }
          });
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
          <p className="text-[#006180] text-[12px] leading-3 no-underline">{user.email}</p>
        </div>
      </div>
    );
  }
}

function logout() {
  signOut();
  localStorage.clear();
}

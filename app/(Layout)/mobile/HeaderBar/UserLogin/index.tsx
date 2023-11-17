import styles from "./UserLogin.module.scss";
import Image from "next/image";
import { useEffect } from "react";
import Swal from "sweetalert2";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import { useUserAccount } from "@/utils/useUserAccount";

export default function UserLogin() {
  const { isLogin, userData, isLoading, login, logout } = useUserAccount();
  const [cookie, setCookie] = useCookies(["confirmed_1"]);

  const route = useRouter();

  useEffect(() => {
    if (isLogin) {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
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

  if (isLoading) {
    return (
      <div className={styles.loginUserPanelWrapper}>
        <div className={styles.loginUserPanel}>
          <p>Loading</p>
        </div>
      </div>
    );
  } else if (!isLogin) {
    return (
      <div
        className={styles.loginUserPanelWrapper}
        onClick={() => login()}
      >
        <div className={styles.loginUserPanel}>
          <p>Login</p>
        </div>
      </div>
    );
  } else {
    return (
      <div
        className={styles.userPanel}
        onClick={() => confirmLogout(logout)}
      >
        <Image
          src={userData && userData.avatar || "https://sig-api.lazco.dev/image/653299930b891d1f6b5b4458"}
          width={50}
          height={50}
          alt="Avatar"
          className={styles.avatar}
        />
      </div>
    );
  }
}

function confirmLogout(logout: () => void) {
  Swal.fire({
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
}
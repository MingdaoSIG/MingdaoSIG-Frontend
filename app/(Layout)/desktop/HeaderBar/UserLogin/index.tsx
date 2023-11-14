import Image from "next/image";
import { useLocalStorage } from "usehooks-ts";
import { useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import styles from "./UserLogin.module.scss";
import { useUserAccount } from "@/utils/useUserAccount";

export default function UserLogin() {
  const { isLogin, userData, isLoading, login, logout } = useUserAccount();
  const [confirmed_1, setConfirmed_1] = useLocalStorage("confirmed_1", false);
  const route = useRouter();

  useEffect(() => {
    if (isLogin) {
      const userData = JSON.parse(localStorage.getItem("User") || "{}");
      if (userData?.badge && userData?.badge.includes("10.21_user")) {
        if (! confirmed_1) {
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
            setConfirmed_1(true);
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed_1, isLogin]);

  if (isLoading) {
    return (
      <div className={styles.loginUserPanelWrapper}>
        <div className={styles.loginUserPanel}>
          <p>Loading ...</p>
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
        <div className={styles.user}>
          <p className={styles.name}>
            {userData && userData.name}
          </p>
          <p className={styles.email}>
            {userData && userData.email}
          </p>
        </div>
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
    confirmButtonText: "Sure!",
    confirmButtonColor: "#DC0032",
  }).then((result) => {
    if (result.isConfirmed) {
      logout();
    }
  });
}
import styles from "./UserLogin.module.scss";
import Image from "next/image";
import Swal from "sweetalert2";
import { useUserAccount } from "@/utils/useUserAccount";

export default function UserLogin() {
  const { isLogin, userData, isLoading, login, logout } = useUserAccount();

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
          src={userData && userData.avatar || process.env.NEXT_PUBLIC_API_URL + "/image/653299930b891d1f6b5b4458"}
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
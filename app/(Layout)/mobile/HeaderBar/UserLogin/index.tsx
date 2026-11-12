import Image from "next/image";
import Swal from "sweetalert2";
import { useUserAccount } from "@/utils/useUserAccount";
import styles from "./UserLogin.module.scss";

export default function UserLogin() {
  const { isLogin, userData, isLoading, login, logout } = useUserAccount();

  if (isLoading) {
    return (
      <div className={`${styles.loginUserPanelWrapper} ${styles.secondary}`}>
        <div className={styles.loginUserPanel}>
          <span>載入中…</span>
        </div>
      </div>
    );
  }
  if (!isLogin) {
    return (
      <button
        type="button"
        className={styles.loginUserPanelWrapper}
        onClick={() => login()}
      >
        <span className={styles.loginUserPanel}>
          <span>登入</span>
        </span>
      </button>
    );
  }
  return (
    <div className="flex items-center justify-center">
      {userData && userData.permission === 2 && (
        <button
          type="button"
          className={`${styles.loginUserPanelWrapper} ${styles.secondary} mr-2`}
          onClick={() => window.open("/admin", "_self")}
        >
          <span className={styles.loginUserPanel}>
            <span>管理平台</span>
          </span>
        </button>
      )}
      <button
        type="button"
        className={styles.userPanel}
        onClick={() => confirmLogout(logout)}
        aria-label="登出"
      >
        <Image
          src={
            userData?.avatar ||
            `${process.env.NEXT_PUBLIC_API_URL}/image/653299930b891d1f6b5b4458`
          }
          width={50}
          height={50}
          alt=""
          className={styles.avatar}
        />
      </button>
    </div>
  );
}

function confirmLogout(logout: () => void) {
  Swal.fire({
    text: "確定要登出嗎？",
    icon: "question",
    showCancelButton: true,
    cancelButtonText: "取消",
    confirmButtonText: "登出",
    confirmButtonColor: "#b42318",
  }).then((result) => {
    if (result.isConfirmed) {
      logout();
    }
  });
}

import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import { NotificationBellMobile } from "@/components/Notifications/NotificationBell";
import { useAdminChrome } from "@/utils/useAdminAccess";
import { useUserAccount } from "@/utils/useUserAccount";
import styles from "./UserLogin.module.scss";

export default function UserLogin() {
  const { isLogin, userData, isLoading, login, logout } = useUserAccount();
  // Admins and SIG managers (leaders, 指導老師) can open the admin panel.
  const { canOpenAdmin, inAdmin } = useAdminChrome();

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
      {(inAdmin || canOpenAdmin) && (
        <Link
          href={inAdmin ? "/" : "/admin"}
          className={`${styles.loginUserPanelWrapper} ${styles.secondary} mr-2`}
        >
          <span className={styles.loginUserPanel}>
            <span>{inAdmin ? "回到網站" : "管理平台"}</span>
          </span>
        </Link>
      )}
      <NotificationBellMobile className="mr-2" />
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

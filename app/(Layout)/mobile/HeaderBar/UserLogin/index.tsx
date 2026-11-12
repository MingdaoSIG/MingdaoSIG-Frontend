import Link from "next/link";
import { useAdminChrome } from "@/utils/useAdminAccess";
import { useUserAccount } from "@/utils/useUserAccount";
import styles from "./UserLogin.module.scss";

// Phone header, right side: 登入 when logged out, 管理平台 / 回到網站 for
// admins and SIG managers. Notifications and the account (我的, 登出)
// live in the tab bar since the 2026 redesign (decision 1B).
export default function UserLogin() {
  const { isLogin, isLoading, login } = useUserAccount();
  const { canOpenAdmin, inAdmin } = useAdminChrome();

  if (isLoading) {
    return null;
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
  if (!inAdmin && !canOpenAdmin) {
    return null;
  }
  return (
    <Link
      href={inAdmin ? "/" : "/admin"}
      className={`${styles.loginUserPanelWrapper} ${styles.secondary}`}
    >
      <span className={styles.loginUserPanel}>
        <span>{inAdmin ? "回到網站" : "管理平台"}</span>
      </span>
    </Link>
  );
}

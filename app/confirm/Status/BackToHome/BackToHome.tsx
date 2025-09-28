import { useRouter } from "next/navigation";

import styles from "./BackToHome.module.scss";

export default function BackToHome() {
  const route = useRouter();

  return (
    <div
      onClick={() => route.replace("/")} // prevent user from going back to confirm page
      className={styles.backToHome}
    >
      Back To Home
    </div>
  );
}

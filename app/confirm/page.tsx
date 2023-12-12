"use client";

import { useRouter, useSearchParams } from "next/navigation";

import styles from "./page.module.scss";
import Link from "next/link";

const Confirm = () => {
  const route = useRouter();
  const searchParams = useSearchParams();

  const confirmId = searchParams.get("confirmId");
  const accept = searchParams.get("accept");

  return (
    <div className={styles.main}>
      <h1>
        {confirmId ? (
          accept ? (
            <>
              Confirm URL : {`${process.env.NEXT_PUBLIC_API_URL}/sig/confirm/${confirmId}?accept=${accept}`}
            </>
          ) : (
            <>
              Missing &quot;accept&quot;
            </>
          )
        ) : (
          <>
            Missing &quot;confirmId&quot;
          </>
        )}
      </h1>
      <div
        onClick={() => route.replace("/")} // prevent user from going back to confirm page
        className={styles.backToHome}
      >
        Back To Home
      </div>
    </div>
  );
};

export default Confirm;
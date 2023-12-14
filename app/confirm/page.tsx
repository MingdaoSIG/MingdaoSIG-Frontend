"use client";

import { useRouter, useSearchParams } from "next/navigation";

import styles from "./page.module.scss";

const Confirm = () => {
  const route = useRouter();
  const searchParams = useSearchParams();

  const confirmId = searchParams.get("confirmId");
  const accept = searchParams.get("accept");

  // if (isValidConfirmId(confirmId) || isValidAccept(accept)) {
  //   route.replace("/");
  // }

  return (
    <div className={styles.main}>
      <h1>
        Confirm URL : {`${process.env.NEXT_PUBLIC_API_URL}/sig/confirm/${confirmId}?accept=${accept}`}
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

function isValidConfirmId(uuid: string | null) {
  if (!uuid) {
    return false;
  }

  const uuidV4Regex = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i;
  return uuidV4Regex.test(uuid);
}

function isValidAccept(accept: string | null) {
  if (!accept) {
    return false;
  }

  return accept === "true" || accept === "false";
}
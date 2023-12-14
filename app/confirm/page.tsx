"use client";

import { useRouter, useSearchParams } from "next/navigation";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";

import Image from "next/image";

export default function Confirm() {
  const route = useRouter();
  const searchParams = useSearchParams();

  const confirmId = searchParams.get("confirmId");
  const accept = searchParams.get("accept");

  const [reqSentRes, setReqSentRes] = useState("none"); // none, 2000 success, fail, 4031 already

  if (!isValidConfirmId(confirmId) || !isValidAccept(accept)) {
    route.replace("/");
  }

  const confirmUrl = `${process.env.NEXT_PUBLIC_API_URL}/sig/confirm/${confirmId}?accept=${accept}`;

  useEffect(() => {
    (async () => {
      const res = await sendConfirmRequest(new URL(confirmUrl));
      if (res.status === 2000) {
        setReqSentRes("success");
      } else if (res.status === 4031) {
        setReqSentRes("already");
      } else {
        setReqSentRes("fail");
      }
    })();
  }, [confirmUrl]);


  if (reqSentRes === "none") {
    return (
      <div className={styles.main}>
        <span className={styles.loader}></span>
        <h1 className={styles.loader_text}>Confirming</h1>
      </div>
    );
  } else if (reqSentRes === "success") {
    return (
      <div className={styles.main}>
        <svg className={styles.status_svg} version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130.2 130.2">
          <circle className={styles.status_path + " " + styles.circle} fill="none" stroke="#73AF55" strokeWidth="6" strokeMiterlimit="10" cx="65.1" cy="65.1" r="62.1" />
          <polyline className={styles.status_path + " " + styles.check} fill="none" stroke="#73AF55" strokeWidth="6" strokeLinecap="round" strokeMiterlimit="10" points="100.2,40.2 51.5,88.8 29.8,67.5 " />
        </svg>
        <h1 className={styles.status_text + " " + styles.success}>Success</h1>
        {/* <div
          onClick={() => route.replace("/")} // prevent user from going back to confirm page
          className={styles.backToHome}
        >
          Back To Home
        </div> */}
      </div>
    );
  } else if (reqSentRes === "already") {
    return (
      <div className={styles.main}>
        <svg className={styles.status_svg} version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130.2 130.2">
          <circle className={styles.status_path + " " + styles.circle} fill="none" stroke="#73AF55" strokeWidth="6" strokeMiterlimit="10" cx="65.1" cy="65.1" r="62.1" />
          <polyline className={styles.status_path + " " + styles.check} fill="none" stroke="#73AF55" strokeWidth="6" strokeLinecap="round" strokeMiterlimit="10" points="100.2,40.2 51.5,88.8 29.8,67.5 " />
        </svg>
        <h1 className={styles.status_text + " " + styles.success}>Already Confirmed</h1>
        {/* <div
          onClick={() => route.replace("/")} // prevent user from going back to confirm page
          className={styles.backToHome}
        >
          Back To Home
        </div> */}
      </div>
    );
  } else if (reqSentRes === "fail") {
    return (
      <div className={styles.main}>
        <svg className={styles.status_svg} version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130.2 130.2">
          <circle className={styles.status_path + " " + styles.circle} fill="none" stroke="#D06079" strokeWidth="6" strokeMiterlimit="10" cx="65.1" cy="65.1" r="62.1" />
          <line className={styles.path + " " + styles.line} fill="none" stroke="#D06079" strokeWidth="6" strokeLinecap="round" strokeMiterlimit="10" x1="34.4" y1="37.9" x2="95.8" y2="92.3" />
          <line className={styles.path + " " + styles.line} fill="none" stroke="#D06079" strokeWidth="6" strokeLinecap="round" strokeMiterlimit="10" x1="95.8" y1="38" x2="34.4" y2="92.2" />
        </svg>
        <h1 className={styles.status_text + " " + styles.error}>Please try again later</h1>
        {/* <div
          onClick={() => route.replace("/")} // prevent user from going back to confirm page
          className={styles.backToHome}
        >
          Back To Home
        </div> */}
      </div>
    );
  }
}

async function sendConfirmRequest(confirmUrl: URL) {
  return await (await fetch(confirmUrl, {
    method: "GET",
  })).json();
}


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
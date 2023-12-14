"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "./page.module.scss";
import { CustomStatus } from "@/modules/customStatusCode";

import Failed from "./Status/Failed/Failed";
import Success from "./Status/Success/Success";
import BackToHome from "./Status/BackToHome/BackToHome";

export default function Confirm() {
  const route = useRouter();
  const searchParams = useSearchParams();

  const confirmId = searchParams.get("confirmId");
  const accept = searchParams.get("accept");

  const [isLoading, setIsLoading] = useState(true);
  const [confirmStatus, setConfirmStatus] = useState(0); // 0: success, 1: already, 2: fail

  const confirmUrl = `${process.env.NEXT_PUBLIC_API_URL}/sig/confirm/${confirmId}?accept=${accept}`;

  if (!isValidConfirmId(confirmId) || !isValidAccept(accept)) {
    route.replace("/");
  }

  const acceptMessage = accept === "true" ? "Accepted" : "Rejected";

  useEffect(() => {
    (async () => {
      setConfirmStatus(await sendConfirmRequest(new URL(confirmUrl)));
      setIsLoading(false);
    })();
  }, [confirmUrl]);

  return (
    <div className={styles.main}>
      {isLoading ? (
        <>
          <span className={styles.loader}></span>
          <h1 className={styles.loader_text}>Confirming</h1>
        </>
      ) : (
        confirmStatus === 0 ? (
          <>
            <Success message={`Successfully ${acceptMessage}`} />
            <BackToHome />
          </>
        ) : (
          confirmStatus === 1 ? (
            <>
              <Success message="Already Confirmed" />
              <BackToHome />
            </>
          ) : (
            <>
              <Failed message="Please try again later" />
              <BackToHome />
            </>
          )
        )
      )
      }
    </div >
  );
}

async function sendConfirmRequest(confirmUrl: URL) {
  const response = await (await fetch(confirmUrl, {
    method: "GET",
  })).json();

  if (response.status === CustomStatus.OK) {
    return 0;
  } else if (response.status === CustomStatus.ALREADY_CONFIRMED) {
    return 1;
  } else {
    return 3;
  }
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
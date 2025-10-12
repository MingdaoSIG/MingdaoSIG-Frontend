"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import styles from "./page.module.scss";
import { CustomStatus } from "@/modules/customStatusCode";

// Desktop/Mobile UI
import Failed from "./Status/Failed/Failed";
import Success from "./Status/Success/Success";
import BackToHome from "./Status/BackToHome/BackToHome";

// 定義類型
type ConfirmStatus = 0 | 1 | 2; // 0: success, 1: already, 2: fail

interface ConfirmResponse {
  status: number;
  message?: string;
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ConfirmContent />
    </Suspense>
  );
}

function Fallback() {
  return (
    <div className={styles.loaderContainer}>
      <span className={styles.loader}></span>
      <h1 className={styles.loader_text}>Confirming</h1>
    </div>
  );
}

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const confirmId = searchParams.get("confirmId");
  const accept = searchParams.get("accept");

  const [isLoading, setIsLoading] = useState(true);
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 驗證並建立 URL
  const confirmUrl =
    isValidConfirmId(confirmId) && isValidAccept(accept)
      ? `${process.env.NEXT_PUBLIC_API_URL}/sig/confirm/${confirmId}?accept=${accept}`
      : null;

  // 處理無效參數
  useEffect(() => {
    if (!isValidConfirmId(confirmId) || !isValidAccept(accept)) {
      console.error("Invalid parameters:", { confirmId, accept });
      router.replace("/");
      return;
    }
  }, [confirmId, accept, router]);

  // 發送確認請求
  useEffect(() => {
    if (!confirmUrl) return;

    let isMounted = true;

    const confirmRequest = async () => {
      try {
        const status = await sendConfirmRequest(new URL(confirmUrl));
        if (isMounted) {
          setConfirmStatus(status);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Confirm request failed:", error);
          setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
          setConfirmStatus(2); // fail
          setIsLoading(false);
        }
      }
    };

    confirmRequest();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [confirmUrl]);

  if (isLoading) return <Fallback />;

  // 如果狀態為 null，顯示錯誤
  if (confirmStatus === null) {
    return (
      <>
        <Failed message="Invalid request" />
        <BackToHome />
      </>
    );
  }

  const acceptMessage = accept === "true" ? "Accepted" : "Rejected";

  switch (confirmStatus) {
    case 0:
      return (
        <>
          <Success message={`Successfully ${acceptMessage}`} />
          <BackToHome />
        </>
      );
    case 1:
      return (
        <>
          <Success message="Already Confirmed" />
          <BackToHome />
        </>
      );
    default:
      return (
        <>
          <Failed message={errorMessage || "Please try again later"} />
          <BackToHome />
        </>
      );
  }
}

async function sendConfirmRequest(confirmUrl: URL): Promise<ConfirmStatus> {
  try {
    const response = await fetch(confirmUrl.toString(), {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ConfirmResponse = await response.json();

    if (data.status === CustomStatus.OK) return 0;
    if (data.status === CustomStatus.ALREADY_CONFIRMED) return 1;

    return 2; // 其他任何狀態都視為失敗
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
}

function isValidConfirmId(uuid: string | null): uuid is string {
  if (!uuid) return false;
  // UUID v4 格式驗證
  const uuidV4Regex =
    /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i;
  return uuidV4Regex.test(uuid);
}

function isValidAccept(accept: string | null): accept is "true" | "false" {
  if (!accept) return false;
  return accept === "true" || accept === "false";
}
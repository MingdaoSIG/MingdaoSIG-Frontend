"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Failed from "./Status/Failed/Failed";
import Success from "./Status/Success/Success";
import BackToHome from "./Status/BackToHome/BackToHome";
import { CustomStatus } from "@/modules/customStatusCode";

type ConfirmStatus = 0 | 1 | 2;

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
    <div className="h-full flex flex-col items-center justify-center gap-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-300 border-t-white animate-spin"></div>
      </div>
      <h1 className="text-5xl font-bold text-white">Confirming</h1>
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

  const confirmUrl =
    isValidConfirmId(confirmId) && isValidAccept(accept)
      ? `${process.env.NEXT_PUBLIC_API_URL}/sig/confirm/${confirmId}?accept=${accept}`
      : null;

  useEffect(() => {
    if (!isValidConfirmId(confirmId) || !isValidAccept(accept)) {
      router.replace("/");
      return;
    }
  }, [confirmId, accept, router]);

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
          setConfirmStatus(2);
          setIsLoading(false);
        }
      }
    };

    confirmRequest();

    return () => {
      isMounted = false;
    };
  }, [confirmUrl]);

  if (isLoading) return <Fallback />;

  if (confirmStatus === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-8 p-4">
        <Failed message="Invalid request" />
        <BackToHome />
      </div>
    );
  }

  const acceptMessage = accept === "true" ? "Accepted" : "Rejected";

  switch (confirmStatus) {
    case 0:
      return (
        <div className="h-full flex flex-col items-center justify-center gap-8 p-4">
          <Success message={`Successfully ${acceptMessage}`} />
          <BackToHome />
        </div>
      );
    case 1:
      return (
        <div className="h-full flex flex-col items-center justify-center gap-8 p-4">
          <Success message="Already Reviewed" />
          <BackToHome />
        </div>
      );
    default:
      return (
        <div className="h-full flex flex-col items-center justify-center gap-8 p-4">
          <Failed message={errorMessage || "Please try again later"} />
          <BackToHome />
        </div>
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

    const data: ConfirmResponse = await response.json();

    if (data.status === CustomStatus.OK) return 0;
    if (data.status === CustomStatus.ALREADY_CONFIRMED) return 1;

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return 2;
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
}

function isValidConfirmId(uuid: string | null): uuid is string {
  if (!uuid) return false;
  const uuidV4Regex =
    /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i;
  return uuidV4Regex.test(uuid);
}

function isValidAccept(accept: string | null): accept is "true" | "false" {
  if (!accept) return false;
  return accept === "true" || accept === "false";
}
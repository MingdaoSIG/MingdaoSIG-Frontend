"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import Swal from "sweetalert2";
import useIsMobile from "@/utils/useIsMobile";
import Information from "./(home)/desktop/Information";
import ThreadsListDesktop from "./(home)/desktop/ThreadsList";

// Mobile Components
import ThreadsListMobile from "./(home)/mobile/ThreadsList";
// Desktop Components
import SplitBlock from "./(Layout)/splitBlock";

export default function Home() {
  // 這裡是「頁面層級」的 Suspense 邊界
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const session = searchParams.get("session");

  useEffect(() => {
    if (error === "not_md") {
      Swal.fire({
        title: "Login Fail",
        text: "You should use your Mingdao email to login!",
        icon: "error",
        confirmButtonText: "Sure",
        allowEscapeKey: false,
        allowOutsideClick: false,
        customClass: { container: "select-none" },
        focusConfirm: false,
        background: "#fff url(/images/trees.png)",
        backdrop: `rgba(0,0,123,0.4) url("/images/nyan-cat.gif") left top no-repeat`,
        preConfirm: () => {
          router.push("/");
        },
      });
    }
  }, [error, router]);

  useEffect(() => {
    if (session) {
      localStorage.setItem("session", session);
      router.push("/");
    }
  }, [session, router]);

  if (isMobile) {
    return <ThreadsListMobile />;
  }
  return (
    <SplitBlock>
      <ThreadsListDesktop />
      <Information />
    </SplitBlock>
  );
}

"use client";

// Desktop Components
import SplitBlock from "./(Layout)/splitBlock";
import ThreadsListDesktop from "./(home)/desktop/ThreadsList";
import Information from "./(home)/desktop/Information";

// Mobile Components
import ThreadsListMobile from "./(home)/mobile/ThreadsList";
import useIsMobile from "@/utils/useIsMobile";

// Module 
import Swal from "sweetalert2";
import { useSearchParams, useRouter } from "next/navigation";

export default function Home() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error === "not_md") {
    Swal.fire({
      title: "登入失敗",
      text: "您使用的帳號並非明道中學的老師或學生！",
      icon: "error",
      confirmButtonText: "Sure",
      allowEscapeKey: false,
      allowOutsideClick: false,
      customClass: {
        container: "select-none",
      },
      focusConfirm: false,
      background: "#fff url(/images/trees.png)",
      backdrop: `
        rgba(0,0,123,0.4)
        url("/images/nyan-cat.gif")
        left top
        no-repeat
      `,
      preConfirm: () => {
        router.push("/");
      }
    });
  }

  if (isMobile) {
    return <ThreadsListMobile />;
  } else {
    return (
      <SplitBlock>
        <ThreadsListDesktop />
        <Information />
      </SplitBlock>
    );
  }
}

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";
import Swal from "sweetalert2";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import useIsMobile from "@/utils/useIsMobile";
import { HomeFeed } from "./(home)/HomeFeed";
import { HomeRail } from "./(home)/HomeRail";
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
  const queryClient = useQueryClient();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error === "not_md") {
      Swal.fire({
        title: "登入失敗",
        text: "請使用明道學校信箱（@ms.mingdao.edu.tw）登入",
        icon: "error",
        confirmButtonText: "確定",
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

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] }),
      queryClient.invalidateQueries({ queryKey: ["hotPost"] }),
      queryClient.invalidateQueries({ queryKey: ["pinnedPost"] }),
    ]);
  }, [queryClient]);

  // The tab bar's 首頁 on the home page: back to the top.
  useEffect(() => {
    if (!isMobile) {
      return;
    }
    const onTop = () => {
      document
        .querySelector("[data-home-feed]")
        ?.closest(".overflow-y-auto")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("mobile:scroll-to-top", onTop);
    return () => window.removeEventListener("mobile:scroll-to-top", onTop);
  }, [isMobile]);

  if (isMobile) {
    return (
      <PullToRefresh
        onRefresh={refresh}
        className="scrollbar-hide relative mx-auto h-full w-full overflow-y-auto px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
      >
        <div data-home-feed>
          <HomeFeed mobile />
        </div>
      </PullToRefresh>
    );
  }
  return (
    <SplitBlock>
      <HomeFeed />
      <HomeRail />
    </SplitBlock>
  );
}

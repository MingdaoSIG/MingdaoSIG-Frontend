"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { TapScaleLink } from "@/components/mobile/TapScale";
import styles from "./HeaderBar.module.scss";
import UserLogin from "./UserLogin";

const HeaderBar = () => {
  const router = useRouter();
  const path = usePathname();

  return (
    <div className={styles.nav}>
      <Image
        src="/images/logo_mobile_v2.svg"
        alt="MDSIG 首頁"
        width={64}
        height={32}
        unoptimized
        className={styles.logo}
        onClick={() => router.push("/")}
      />
      <div className="flex items-center gap-2">
        {path !== "/search" && (
          <TapScaleLink
            href="/search"
            aria-label="搜尋"
            className="flex size-10 items-center justify-center rounded-control border border-line bg-surface text-ink-700"
            whileTap={{ scale: 0.92 }}
          >
            <Search size={20} aria-hidden />
          </TapScaleLink>
        )}
        <UserLogin />
      </div>
    </div>
  );
};

export default HeaderBar;

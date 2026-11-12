"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TapScaleLink } from "@/components/mobile/TapScale";
import { useAdminChrome } from "@/utils/useAdminAccess";
import styles from "./HeaderBar.module.scss";
import UserLogin from "./UserLogin";

const HeaderBar = () => {
  const path = usePathname();
  const { inAdmin } = useAdminChrome();

  return (
    <div className={styles.nav}>
      <Link href="/" aria-label="MDSIG 首頁" className="flex">
        <Image
          src="/images/logo_mobile_v2.svg"
          alt=""
          width={64}
          height={32}
          unoptimized
          className={styles.logo}
        />
      </Link>
      <div className="flex items-center gap-2">
        {path !== "/search" && !inAdmin && (
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

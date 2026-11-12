"use client";

import Image from "next/image";
import Link from "next/link";
import { useAdminChrome } from "@/utils/useAdminAccess";
import HeaderSearch from "./HeaderSearch";
import UserLogin from "./UserLogin";

const HeaderBar = () => {
  // The admin panel is a full-width work area (sidebar on the left), so
  // its header spans the window instead of the 80rem page container.
  const { inAdmin } = useAdminChrome();

  return (
    <header
      data-shell="header"
      className="glass-bar sticky top-0 z-40 h-16 w-full cursor-default select-none border-line border-b"
    >
      <nav
        className={`flex h-full items-center justify-between ${
          inAdmin ? "w-full px-6" : "mx-auto w-[min(80rem,100%-4rem)]"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link href={"/"} className="cursor-pointer" aria-label="MDSIG 首頁">
            <Image
              src="/images/logo.svg"
              alt="MDSIG"
              width={149}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
          {inAdmin && (
            <span className="rounded-chip border border-line-strong bg-surface px-2.5 py-0.5 font-semibold text-ink-700 text-sm">
              管理平台
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Site search; the admin panel has its own search fields. */}
          {!inAdmin && <HeaderSearch />}
          <UserLogin />
        </div>
      </nav>
    </header>
  );
};

export default HeaderBar;

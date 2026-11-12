"use client";

import Image from "next/image";
import Link from "next/link";
import { useAdminChrome } from "@/utils/useAdminAccess";
import { useUserAccount } from "@/utils/useUserAccount";
import HeaderSearch from "./HeaderSearch";
import UserMenu from "./UserMenu";

// Desktop header (decision 2): logo, the site search, and the avatar menu
// (the 我的 hub). Notifications live in the side rail. Admins and SIG
// managers keep 「管理平台」 here; inside the panel it is 「回到網站」.

const secondaryButton =
  "flex h-10 cursor-pointer items-center rounded-control border border-line-strong bg-surface px-4 font-semibold text-brand-700 text-sm transition-colors hover:bg-field";

function Account() {
  const { isLogin, isLoading, login } = useUserAccount();
  const { canOpenAdmin, inAdmin } = useAdminChrome();

  if (isLoading) {
    return (
      <div
        aria-hidden
        className="h-10 w-16 animate-pulse rounded-control bg-field"
      />
    );
  }
  if (!isLogin) {
    return (
      <button
        type="button"
        className="h-10 cursor-pointer rounded-control bg-brand-700 px-6 font-semibold text-sm text-white shadow-[0_6px_16px_-10px_rgba(11,90,131,0.9)] transition-colors hover:bg-brand-800"
        onClick={() => login()}
      >
        登入
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {inAdmin ? (
        <Link href="/" className={secondaryButton}>
          回到網站
        </Link>
      ) : (
        canOpenAdmin && (
          <Link href="/admin" className={secondaryButton}>
            管理平台
          </Link>
        )
      )}
      <UserMenu />
    </div>
  );
}

const HeaderBar = () => {
  const { inAdmin } = useAdminChrome();

  return (
    <header
      data-shell="header"
      className="glass-bar sticky top-0 z-40 h-16 w-full cursor-default select-none border-line border-b"
    >
      <nav
        aria-label="網站"
        className="flex h-full w-full items-center justify-between gap-6 pr-6 pl-4"
      >
        <div className="flex shrink-0 items-center gap-3">
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
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          {/* Site search; the admin panel has its own search fields. */}
          {!inAdmin && <HeaderSearch />}
          <Account />
        </div>
      </nav>
    </header>
  );
};

export default HeaderBar;

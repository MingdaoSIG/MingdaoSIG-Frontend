"use client";

import Image from "next/image";
import Link from "next/link";
import UserLogin from "./UserLogin";

const HeaderBar = () => {
  return (
    <header
      data-shell="header"
      className="glass-bar sticky top-0 z-40 h-16 w-full cursor-default select-none border-line border-b"
    >
      <nav className="mx-auto flex h-full w-[min(80rem,100%-4rem)] items-center justify-between">
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
        <UserLogin />
      </nav>
    </header>
  );
};

export default HeaderBar;

"use client";

import Image from "next/image";
import Link from "next/link";
import UserLogin from "./UserLogin";

const HeaderBar = () => {
  return (
    <nav className="h-[3.7rem] w-[85vw] mx-auto flex flex-row justify-between items-center cursor-default select-none">
      <Link href={"/"} className="my-auto cursor-pointer">
        <Image
          src="/images/logo.svg"
          alt="Logo"
          width={214}
          height={46}
          priority
        />
      </Link>
      <UserLogin />
    </nav>
  );
};

export default HeaderBar;

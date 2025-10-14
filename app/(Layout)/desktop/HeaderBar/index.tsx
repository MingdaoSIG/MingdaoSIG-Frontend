"use client";

import Link from "next/link";
import UserLogin from "./UserLogin";
import Image from "next/image";

import { useRouter } from "next/navigation";

const HeaderBar = () => {
  const router = useRouter();

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
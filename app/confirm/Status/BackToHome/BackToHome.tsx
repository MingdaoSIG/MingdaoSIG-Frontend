"use client";

import { useRouter } from "next/navigation";

export default function BackToHome() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.replace("/")}
      className="cursor-pointer select-none in-[.wrap]:rounded-control rounded-2xl bg-[rgb(0,145,189)] in-[.wrap]:bg-brand-700 in-[.wrap]:px-5 px-6 in-[.wrap]:py-3 py-4 font-semibold text-white transition-opacity hover:opacity-90"
    >
      Back To Home
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";

export default function BackToHome() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.replace("/")}
      className="cursor-pointer select-none rounded-control bg-brand-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-800"
    >
      Back To Home
    </button>
  );
}

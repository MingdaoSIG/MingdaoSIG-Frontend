"use client";

import { useRouter } from "next/navigation";

export default function BackToHome() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.replace("/")}
      className="cursor-pointer select-none rounded-2xl px-6 py-4 font-semibold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: "rgb(0, 145, 189)" }}
    >
      Back To Home
    </button>
  );
}

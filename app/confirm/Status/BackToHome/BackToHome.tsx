"use client";

import { useRouter } from "next/navigation";

export default function BackToHome() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.replace("/")}
      className="px-6 py-4 rounded-2xl text-white font-semibold cursor-pointer select-none hover:opacity-90 transition-opacity"
      style={{ backgroundColor: "rgb(0, 145, 189)" }}
    >
      Back To Home
    </button>
  );
}
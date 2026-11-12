"use client";

import { useUserAccount } from "@/utils/useUserAccount";

/**
 * Shown above the editor to logged-out visitors, so they learn before
 * writing that publishing needs an account (the draft is kept locally).
 */
export function LoginBanner({ className = "" }: { className?: string }) {
  const { isLogin, isLoading, login } = useUserAccount();

  if (isLogin || isLoading) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-card border border-brand-700/20 bg-brand-50 px-4 py-2 text-ink-800 text-sm ${className}`}
    >
      <p className="min-w-0 flex-1 leading-6">
        登入後才能發文，草稿會自動保存在這台裝置。
      </p>
      <button
        type="button"
        onClick={() => login()}
        className="h-10 shrink-0 cursor-pointer rounded-control bg-brand-700 px-5 font-semibold text-white transition-colors hover:bg-brand-800"
      >
        登入
      </button>
    </div>
  );
}

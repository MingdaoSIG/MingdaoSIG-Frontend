"use client";

import { useId, useState } from "react";

import { useUserAccount } from "@/utils/useUserAccount";

import { postUser } from "../apis/postUserAPI";

/**
 * 「有人留言時寄信通知我」 on your own profile (`notifyComments`, contract
 * v3 §4.2). Missing means on. The switch flips at once and flips back if
 * the backend refuses.
 */
export function NotifyToggle({ mobile = false }: { mobile?: boolean }) {
  const { userData, token, updateUser } = useUserAccount();
  const labelId = useId();
  const hintId = useId();
  const saved = userData?.notifyComments !== false;
  const [pending, setPending] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const on = pending ?? saved;

  async function toggle() {
    if (pending !== null || !token) {
      return;
    }
    const next = !on;
    setPending(next);
    setError(null);
    const result = await postUser({ notifyComments: next }, token);
    if (result.ok) {
      updateUser({ notifyComments: next });
    } else {
      setError(`沒有儲存：${result.message}`);
    }
    setPending(null);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p
            id={labelId}
            className={`font-semibold text-ink-800 ${
              mobile ? "text-sm" : "text-[0.9rem]"
            }`}
          >
            有人留言時寄信通知我
          </p>
          <p id={hintId} className="text-ink-500 text-xs leading-5">
            有人留言在你的貼文，或回覆你的留言時，寄信到你的學校信箱。
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby={labelId}
          aria-describedby={hintId}
          aria-busy={pending !== null}
          onClick={toggle}
          className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors ${
            mobile ? "h-8 w-[3.25rem]" : "h-6 w-11"
          } ${on ? "bg-brand-700" : "bg-ink-400/60"}`}
        >
          <span
            aria-hidden
            className={`absolute rounded-full bg-white shadow-sm transition-transform ${
              mobile ? "top-1 left-1 size-6" : "top-0.5 left-0.5 size-5"
            } ${on ? "translate-x-5" : ""}`}
          />
        </button>
      </div>
      {error && (
        <p role="alert" className="text-danger-700 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

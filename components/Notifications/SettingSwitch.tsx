"use client";

import { useId } from "react";

/** One labelled on/off setting (the switch the profile settings use). */
export function SettingSwitch({
  label,
  hint,
  checked,
  busy = false,
  error,
  mobile = false,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  busy?: boolean;
  error?: string | null;
  mobile?: boolean;
  onChange: (next: boolean) => void;
}) {
  const labelId = useId();
  const hintId = useId();

  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p
            id={labelId}
            className={`font-semibold text-ink-800 ${
              mobile ? "text-sm" : "text-[0.9rem]"
            }`}
          >
            {label}
          </p>
          {hint && (
            <p id={hintId} className="text-ink-500 text-xs leading-5">
              {hint}
            </p>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={labelId}
          aria-describedby={hint ? hintId : undefined}
          aria-busy={busy}
          onClick={() => {
            if (!busy) {
              onChange(!checked);
            }
          }}
          className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors ${
            mobile ? "h-8 w-[3.25rem]" : "h-6 w-11"
          } ${checked ? "bg-brand-700" : "bg-ink-400/60"}`}
        >
          <span
            aria-hidden
            className={`absolute rounded-full bg-white shadow-sm transition-transform ${
              mobile ? "top-1 left-1 size-6" : "top-0.5 left-0.5 size-5"
            } ${checked ? "translate-x-5" : ""}`}
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

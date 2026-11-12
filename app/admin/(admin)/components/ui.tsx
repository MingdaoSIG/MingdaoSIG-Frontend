"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import { imageUrl } from "../api";

// Building blocks of the admin panel, on the 2026 design tokens
// (docs/redesign/redesign-2026.md): white cards on the canvas, brand-700
// for the main action, 10/8/6px radii, no gradients, no pill buttons.

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "danger-outline"
  | "ghost";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-700",
  secondary:
    "border border-line-strong bg-surface text-ink-700 hover:bg-field disabled:bg-surface",
  danger:
    "bg-danger-700 text-white hover:bg-danger-700/90 disabled:bg-danger-700",
  "danger-outline":
    "border border-line-strong bg-surface text-danger-700 hover:bg-danger-50 disabled:bg-surface",
  ghost: "text-ink-700 hover:bg-field disabled:bg-transparent",
};

export function buttonClass(
  variant: ButtonVariant = "secondary",
  size: "sm" | "md" = "md",
) {
  return `inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-control font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    size === "sm" ? "h-8 px-2.5 text-[13px]" : "h-9 px-3.5 text-sm"
  } ${VARIANT[variant]}`;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${buttonClass(variant, size)} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export type BadgeTone = "warn" | "info" | "danger" | "ok" | "mute";

const TONE: Record<BadgeTone, string> = {
  warn: "bg-warm-50 text-warm-600",
  info: "bg-brand-50 text-brand-800",
  danger: "bg-danger-50 text-danger-700",
  ok: "bg-ok-50 text-ok-700",
  mute: "bg-field text-ink-500",
};

export function Badge({
  tone = "mute",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-chip px-1.5 py-px font-semibold text-xs leading-5 ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Card({
  title,
  actions,
  children,
  className = "",
  padded = true,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-card border border-line bg-surface shadow-card ${
        padded ? "p-4 lg:p-5" : ""
      } ${className}`}
    >
      {(title || actions) && (
        <div
          className={`flex items-center justify-between gap-3 ${
            padded ? "mb-3" : "px-4 pt-4 pb-3 lg:px-5"
          }`}
        >
          {title && (
            <h2 className="min-w-0 font-bold text-base text-ink-900">
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** Inputs are 16px on phones: iOS Safari zooms into anything smaller. */
export const inputClass =
  "h-9 w-full min-w-0 rounded-control border border-line bg-field px-3 text-base text-ink-800 transition-colors placeholder:text-ink-400 focus:border-brand-700 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-700/20 disabled:cursor-not-allowed disabled:opacity-60 lg:text-sm";

export const selectClass = `${inputClass} cursor-pointer pr-8`;

export const textareaClass =
  "w-full min-w-0 rounded-control border border-line bg-field px-3 py-2 text-base text-ink-800 leading-relaxed transition-colors placeholder:text-ink-400 focus:border-brand-700 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-700/20 disabled:cursor-not-allowed disabled:opacity-60 lg:text-sm";

export const linkClass =
  "text-brand-700 underline decoration-brand-700/30 underline-offset-[0.2em] transition-colors hover:text-brand-800 hover:decoration-current";

export function Spinner({ label = "載入中" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink-500 text-sm">
      <LoaderCircle aria-hidden className="size-4 animate-spin" />
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
      <p className="font-semibold text-ink-700 text-sm">{title}</p>
      {children && <div className="text-ink-500 text-sm">{children}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 px-4 py-10 text-center"
    >
      <p className="flex items-center gap-2 text-danger-700 text-sm">
        <CircleAlert aria-hidden className="size-4 shrink-0" />
        {message}
      </p>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          重試
        </Button>
      )}
    </div>
  );
}

/** Grey bars while a list loads for the first time. */
export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-3 p-4">
      {Array.from({ length: rows }, (_, i) => `skeleton-${i}`).map((key) => (
        <div key={key} className="h-5 animate-pulse rounded-chip bg-field" />
      ))}
    </div>
  );
}

export function Avatar({
  src,
  name,
  size = 32,
  square = false,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  square?: boolean;
}) {
  const url = imageUrl(src);
  const shape = square ? "rounded-control" : "rounded-full";
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={size}
        height={size}
        unoptimized
        className={`shrink-0 bg-field object-cover ${shape}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center bg-brand-50 font-semibold text-brand-800 ${shape}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {(name ?? "").trim().charAt(0) || "?"}
    </span>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={htmlFor} className="font-semibold text-ink-700 text-xs">
        {label}
      </label>
      {children}
      {hint && <div className="text-ink-500 text-xs">{hint}</div>}
    </div>
  );
}

/** A label: value row in a drawer. */
export function InfoRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 py-1.5 text-sm">
      <dt className="text-ink-500">{label}</dt>
      <dd className="min-w-0 break-words text-ink-800">{children}</dd>
    </div>
  );
}

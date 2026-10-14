"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastInternal = {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
};

type ToastOptions = {
  action?: ToastAction;
};

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 3000;

let toasts: ToastInternal[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of Array.from(listeners)) {
    listener();
  }
}

function add(type: ToastType, message: string, options?: ToastOptions) {
  const id = nextId++;
  const next: ToastInternal = { id, type, message, action: options?.action };
  toasts = [...toasts, next];
  if (toasts.length > MAX_TOASTS) {
    toasts = toasts.slice(toasts.length - MAX_TOASTS);
  }
  notify();
  if (!options?.action) {
    setTimeout(() => remove(id), AUTO_DISMISS_MS);
  }
}

function remove(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    add("success", message, options),
  error: (message: string, options?: ToastOptions) =>
    add("error", message, options),
  info: (message: string, options?: ToastOptions) =>
    add("info", message, options),
};

const typeStyles: Record<ToastType, { bg: string; icon: string; fg: string }> =
  {
    // Neutral dark toast; the type is carried by the icon colour
    // (white on saturated green/red/blue failed WCAG AA).
    success: { bg: "rgba(29, 42, 55, 0.96)", icon: "✓", fg: "#3ccf8e" },
    error: { bg: "rgba(29, 42, 55, 0.96)", icon: "!", fg: "#f87171" },
    info: { bg: "rgba(29, 42, 55, 0.96)", icon: "i", fg: "#7cc4ea" },
  };

function ToastItem({ toast: t }: { toast: ToastInternal }) {
  const styles = typeStyles[t.type];

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 400) {
      remove(t.id);
    }
  };

  return (
    <motion.div
      layout
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      onDragEnd={handleDragEnd}
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -32, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      role={t.type === "error" ? "alert" : "status"}
      style={{
        backgroundColor: styles.bg,
        color: "white",
        padding: "12px 16px",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 10px 28px -10px rgba(17, 29, 41, 0.55)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        backdropFilter: "blur(10px)",
        maxWidth: "90vw",
        pointerEvents: "auto",
        touchAction: "pan-y",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          backgroundColor: styles.fg,
          color: "#111d29",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        {styles.icon}
      </span>
      <span style={{ flex: 1 }}>{t.message}</span>
      {t.action && (
        <button
          type="button"
          onClick={() => {
            t.action?.onClick();
            remove(t.id);
          }}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.16)",
            border: "none",
            color: "white",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t.action.label}
        </button>
      )}
    </motion.div>
  );
}

export function ToastProvider() {
  const [items, setItems] = useState<ToastInternal[]>(toasts);

  useEffect(() => {
    const listener = () => setItems([...toasts]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top) + 8px)",
        left: 0,
        right: 0,
        zIndex: 9999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastProvider;

"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { DraggableSheet } from "@/components/mobile/DraggableSheet";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: string[];
  initialSnap?: number;
  children: ReactNode;
};

export function BottomSheet({
  open,
  onClose,
  title,
  snapPoints = ["60%", "90%"],
  initialSnap = 0,
  children,
}: BottomSheetProps) {
  const [snapIndex, setSnapIndex] = useState(initialSnap);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  const handleHandleClick = useCallback(() => {
    setSnapIndex((current) => (current + 1) % snapPoints.length);
  }, [snapPoints.length]);

  const height = snapPoints[snapIndex];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999998,
            }}
          />
          <DraggableSheet
            key="sheet"
            onDismiss={onClose}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              height,
              maxHeight: "95dvh",
              backgroundColor: "rgba(255, 255, 255, 0.97)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.15)",
              zIndex: 999999,
              display: "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <button
              type="button"
              onClick={handleHandleClick}
              aria-label="Toggle sheet height"
              style={{
                padding: "10px 0",
                display: "flex",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "grab",
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 4,
                  backgroundColor: "#cbd5e1",
                  borderRadius: 2,
                }}
              />
            </button>
            {title && (
              <div
                style={{
                  padding: "0 20px 12px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: 18,
                    color: "#0f172a",
                  }}
                >
                  {title}
                </h2>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            )}
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {children}
            </div>
          </DraggableSheet>
        </>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;

"use client";

import { useEffect, useState } from "react";

export type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

const ZERO: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

function readInsets(): SafeAreaInsets {
  if (typeof window === "undefined") {
    return ZERO;
  }
  const probe = document.createElement("div");
  probe.style.position = "fixed";
  probe.style.top = "env(safe-area-inset-top)";
  probe.style.right = "env(safe-area-inset-right)";
  probe.style.bottom = "env(safe-area-inset-bottom)";
  probe.style.left = "env(safe-area-inset-left)";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  const styles = window.getComputedStyle(probe);
  const insets: SafeAreaInsets = {
    top: parsePx(styles.top),
    right: parsePx(styles.right),
    bottom: parsePx(styles.bottom),
    left: parsePx(styles.left),
  };
  document.body.removeChild(probe);
  return insets;
}

function parsePx(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>(ZERO);

  useEffect(() => {
    setInsets(readInsets());
    const onResize = () => setInsets(readInsets());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return insets;
}

export default useSafeArea;

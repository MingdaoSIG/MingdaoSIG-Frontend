"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/modules/push";
import { captureInstallPrompt } from "@/modules/push/install";

/**
 * Mounted once (app/providers.tsx). Keeps the install prompt for the
 * install buttons, and in production registers the push-only service
 * worker after the page has loaded. Neither shows anything by itself, and
 * nothing subscribes to push here.
 */
export function PwaSetup() {
  useEffect(() => {
    captureInstallPrompt();
    const register = () => {
      void registerServiceWorker();
    };
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}

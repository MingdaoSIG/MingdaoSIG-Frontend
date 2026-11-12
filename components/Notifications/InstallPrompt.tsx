"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useInstallPrompt } from "@/modules/push/install";
import { storageGet, storageSet } from "@/utils/safeStorage";

// 「安裝 MDSIG」 for Android and desktop browsers that fire
// `beforeinstallprompt` (api-contract-v4 §2.4): always in the notification
// settings while the browser offers it, and once, dismissibly, on
// /notifications. iOS has no such event; its steps are in <PushControl>.

const NOTICE_SHOWN_KEY = "mdsig-install-notice-shown";

const TEXT = "像 App 一樣從主畫面或桌面打開 MDSIG，通知也更穩定。";

const primaryButton =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-control bg-brand-700 px-3.5 font-semibold text-sm text-white transition-colors hover:bg-brand-800";

/** The row in the notification settings. Nothing when unavailable. */
export function InstallSetting({ mobile = false }: { mobile?: boolean }) {
  const { available, install } = useInstallPrompt();
  if (!available) {
    return null;
  }
  return (
    <section className="flex items-center gap-3 border-line border-t pt-4">
      <div className="min-w-0 flex-1">
        <h3
          className={`font-semibold text-ink-800 ${
            mobile ? "text-sm" : "text-[0.9rem]"
          }`}
        >
          安裝 MDSIG
        </h3>
        <p className="text-ink-500 text-xs leading-5">{TEXT}</p>
      </div>
      <button
        type="button"
        className={`${primaryButton} ${mobile ? "h-11" : ""}`}
        onClick={() => void install()}
      >
        <Download size={16} aria-hidden />
        安裝
      </button>
    </section>
  );
}

/**
 * The card on /notifications: shown the first time the browser offers to
 * install, never again after that (closing it just hides it sooner).
 */
export function InstallNotice({ mobile = false }: { mobile?: boolean }) {
  const { available, install } = useInstallPrompt();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!available || show) {
      return;
    }
    if (storageGet(NOTICE_SHOWN_KEY)) {
      return;
    }
    storageSet(NOTICE_SHOWN_KEY, "1");
    setShow(true);
  }, [available, show]);

  if (!show || !available) {
    return null;
  }
  return (
    <aside
      aria-label="安裝 MDSIG"
      className={`flex items-center gap-3 rounded-card border border-line bg-surface shadow-card ${
        mobile ? "p-3" : "px-5 py-4"
      }`}
    >
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-chip bg-brand-50 text-brand-700">
        <Download size={18} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink-900 text-sm">安裝 MDSIG</p>
        <p className="text-ink-500 text-xs leading-5">{TEXT}</p>
      </div>
      <button
        type="button"
        className={`${primaryButton} ${mobile ? "h-11" : ""}`}
        onClick={() => {
          setShow(false);
          void install();
        }}
      >
        安裝
      </button>
      <button
        type="button"
        aria-label="不用了"
        className={`flex shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-500 transition-colors hover:bg-field ${
          mobile ? "size-11" : "size-9"
        }`}
        onClick={() => setShow(false)}
      >
        <X size={18} aria-hidden />
      </button>
    </aside>
  );
}

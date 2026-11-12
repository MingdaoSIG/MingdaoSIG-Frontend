"use client";

import { BellOff, BellRing, Check, Share } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import {
  disablePush,
  enablePush,
  isIos,
  isPushSubscribed,
  notificationPermission,
  type PushSupport,
  pushSupport,
} from "@/modules/push";

// Push on this browser (api-contract-v4 §2.3). Subscribing only ever
// starts from the button. iPhone / iPad get install steps instead until
// MDSIG is opened from the home screen.

type State =
  | { kind: "checking" }
  | { kind: "ios-install" }
  | { kind: "unsupported" }
  | { kind: "denied" }
  | { kind: "off" }
  | { kind: "on" };

function initialState(support: PushSupport): State {
  if (support === "ios-install") {
    return { kind: "ios-install" };
  }
  if (support === "unsupported") {
    return { kind: "unsupported" };
  }
  if (notificationPermission() === "denied") {
    return { kind: "denied" };
  }
  return { kind: "checking" };
}

const primaryButton =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control bg-brand-700 px-4 font-semibold text-sm text-white transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-60";
const secondaryButton =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface px-4 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-wait disabled:opacity-60";

export function PushControl({ mobile = false }: { mobile?: boolean }) {
  const [state, setState] = useState<State>({ kind: "checking" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const height = mobile ? "h-11" : "h-9";

  useEffect(() => {
    let cancelled = false;
    const first = initialState(pushSupport());
    setState(first);
    if (first.kind !== "checking") {
      return;
    }
    isPushSubscribed().then((subscribed) => {
      if (!cancelled) {
        setState({ kind: subscribed ? "on" : "off" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Allowed again in the browser's site settings: offer the button again.
  useEffect(() => {
    if (state.kind !== "denied") {
      return;
    }
    const recheck = () => {
      if (notificationPermission() !== "denied") {
        setState({ kind: "off" });
      }
    };
    window.addEventListener("focus", recheck);
    return () => window.removeEventListener("focus", recheck);
  }, [state.kind]);

  async function turnOn() {
    setBusy(true);
    setMessage(null);
    const result = await enablePush();
    setBusy(false);
    if (result.ok) {
      setState({ kind: "on" });
      return;
    }
    if (result.reason === "denied") {
      setState({ kind: "denied" });
      return;
    }
    if (result.reason === "ios-install") {
      setState({ kind: "ios-install" });
      return;
    }
    setMessage(result.message);
  }

  async function turnOff() {
    setBusy(true);
    setMessage(null);
    await disablePush();
    setBusy(false);
    setState({ kind: "off" });
  }

  let body: ReactNode = null;
  switch (state.kind) {
    case "checking":
      body = (
        <p className="text-ink-500 text-xs">正在確認這台裝置的通知狀態…</p>
      );
      break;
    case "ios-install":
      body = <IosInstallSteps />;
      break;
    case "unsupported":
      body = (
        <p className="text-ink-700 text-sm leading-6">
          {isIos()
            ? "這台裝置的 iOS 版本不支援網頁通知，請更新到 iOS 16.4 以上。"
            : "這個瀏覽器不支援網頁通知。可以改用 Chrome、Edge、Firefox 或 Safari。"}
        </p>
      );
      break;
    case "denied":
      body = (
        <p
          role="alert"
          className="flex gap-2 rounded-control bg-warm-50 px-3 py-2.5 text-ink-800 text-sm leading-6"
        >
          <BellOff
            size={18}
            className="mt-0.5 shrink-0 text-warm-600"
            aria-hidden
          />
          <span>
            你已封鎖 MDSIG
            的通知。請到瀏覽器的網站設定，把「通知」改成允許，再回來按「
            {mobile ? "開啟手機通知" : "開啟瀏覽器通知"}」。
          </span>
        </p>
      );
      break;
    case "on":
      body = (
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex min-w-0 flex-1 items-center gap-1.5 font-semibold text-ok-700 text-sm">
            <Check size={16} aria-hidden />
            這台裝置已開啟通知
          </p>
          <button
            type="button"
            className={`${secondaryButton} ${height}`}
            disabled={busy}
            onClick={turnOff}
          >
            關閉這台裝置的通知
          </button>
        </div>
      );
      break;
    case "off":
      body = (
        <div className="flex flex-wrap items-center gap-3">
          <p className="min-w-0 flex-1 text-ink-500 text-xs leading-5">
            有人留言、回覆或按讚時，即使沒開著 MDSIG 也會跳出通知。
          </p>
          <button
            type="button"
            className={`${primaryButton} ${height}`}
            disabled={busy}
            onClick={turnOn}
          >
            <BellRing size={16} aria-hidden />
            {busy ? "開啟中…" : mobile ? "開啟手機通知" : "開啟瀏覽器通知"}
          </button>
        </div>
      );
      break;
  }

  return (
    <div className="flex flex-col gap-2" data-push-state={state.kind}>
      {body}
      {message && (
        <p role="alert" className="text-danger-700 text-xs">
          {message}
        </p>
      )}
    </div>
  );
}

/** iOS only delivers push to sites opened from the home screen. */
function IosInstallSteps() {
  return (
    <div className="rounded-control bg-field px-3 py-3 text-ink-700 text-sm leading-6">
      <p className="font-semibold text-ink-900">
        iPhone、iPad 要先把 MDSIG 加到主畫面
      </p>
      <ol className="mt-1 list-decimal pl-5">
        <li>用 Safari 打開 MDSIG（在其他 App 裡請先改用 Safari 開啟）。</li>
        <li>
          點畫面下方的「分享」
          <Share
            size={14}
            className="mx-0.5 inline-block align-[-2px]"
            aria-label="分享圖示"
          />
          按鈕。
        </li>
        <li>選「加入主畫面」，再點「新增」。</li>
        <li>從主畫面打開 MDSIG，回到這裡按「開啟手機通知」。</li>
      </ol>
      <p className="mt-1 text-ink-500 text-xs">需要 iOS 16.4 以上。</p>
    </div>
  );
}

import { apiRequest } from "@/modules/api/client";

// Web push (api-contract-v4 §2.3). The service worker (public/sw.js) is
// registered in production builds only; it shows pushes and opens their
// link, and caches nothing. Subscribing always starts from a click.
//
// iOS gives push only to sites added to the home screen (iOS 16.4+), so
// there the settings show how to install instead of the button.

export const SERVICE_WORKER_URL = "/sw.js";

export type PushSupport = "supported" | "ios-install" | "unsupported";

export type PushFailure =
  | "unsupported"
  | "ios-install"
  | "denied"
  | "dismissed"
  | "server-disabled"
  | "no-service-worker"
  | "subscribe-failed"
  | "api";

export type PushResult =
  | { ok: true }
  | { ok: false; reason: PushFailure; message: string };

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export function isIos() {
  if (typeof navigator === "undefined") {
    return false;
  }
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return true;
  }
  // iPadOS asks for the desktop site and reports itself as a Mac.
  return /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
}

/** Opened from the home screen / as an installed app. */
export function isStandalone() {
  if (typeof window === "undefined") {
    return false;
  }
  if ((navigator as NavigatorWithStandalone).standalone === true) {
    return true;
  }
  return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
}

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") {
    return "unsupported";
  }
  if (isIos() && !isStandalone()) {
    return "ios-install";
  }
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }
  return "supported";
}

/** "granted" | "denied" | "default", or null without the Notification API. */
export function notificationPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }
  return Notification.permission;
}

/** Development builds never register the worker (it would outlive them). */
export function serviceWorkerEnabled() {
  return (
    process.env.NODE_ENV === "production" &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator
  );
}

export async function registerServiceWorker() {
  if (!serviceWorkerEnabled()) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
      scope: "/",
    });
  } catch (error) {
    console.warn("Service worker registration failed:", error);
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), ms);
    }),
  ]);
}

/** The registration once its worker is active, or null. */
async function activeRegistration() {
  const registration = await registerServiceWorker();
  if (!registration) {
    return null;
  }
  if (registration.active) {
    return registration;
  }
  return withTimeout(navigator.serviceWorker.ready, 10 * 1000);
}

async function existingSubscription() {
  if (!serviceWorkerEnabled() || !("PushManager" in window)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    return (await registration?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

/** Whether this browser currently has a push subscription. */
export async function isPushSubscribed() {
  return (await existingSubscription()) !== null;
}

/** VAPID public key (URL-safe base64) as the bytes subscribe() wants. */
export function base64UrlToBytes(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

function sameKey(current: ArrayBuffer | null, next: Uint8Array) {
  if (!current) {
    return false;
  }
  const bytes = new Uint8Array(current);
  return (
    bytes.length === next.length && bytes.every((byte, i) => byte === next[i])
  );
}

function fail(reason: PushFailure, message: string): PushResult {
  return { ok: false, reason, message };
}

const MESSAGES: Record<Exclude<PushFailure, "api">, string> = {
  unsupported: "這個瀏覽器不支援網頁通知。",
  "ios-install": "請先把 MDSIG 加到主畫面，再從主畫面打開來開啟通知。",
  denied: "你已封鎖這個網站的通知。請到瀏覽器的網站設定允許通知，再回來開啟。",
  dismissed: "沒有開啟通知：你關掉了瀏覽器的詢問視窗。",
  "server-disabled": "通知服務暫時無法使用，請稍後再試。",
  "no-service-worker": "無法啟用通知服務，請重新整理頁面後再試。",
  "subscribe-failed": "瀏覽器無法完成通知訂閱，請稍後再試。",
};

/**
 * Subscribes this browser and saves the subscription. Call it straight
 * from a click: Safari only shows the permission prompt for a user action,
 * so asking is the first thing it does.
 */
export async function enablePush(): Promise<PushResult> {
  const support = pushSupport();
  if (support !== "supported") {
    return fail(support, MESSAGES[support]);
  }

  let permission = Notification.permission;
  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = Notification.permission;
    }
  }
  if (permission === "denied") {
    return fail("denied", MESSAGES.denied);
  }
  if (permission !== "granted") {
    return fail("dismissed", MESSAGES.dismissed);
  }

  const key = await apiRequest<{ publicKey?: unknown }>("/push/public-key");
  if (!key.ok) {
    const disabled = key.httpStatus === 503 || key.status === 5000;
    return disabled
      ? fail("server-disabled", MESSAGES["server-disabled"])
      : fail("api", key.message);
  }
  const publicKey = key.data?.publicKey;
  if (typeof publicKey !== "string" || publicKey === "") {
    return fail("server-disabled", MESSAGES["server-disabled"]);
  }

  const registration = await activeRegistration();
  if (!registration) {
    return fail("no-service-worker", MESSAGES["no-service-worker"]);
  }

  let applicationServerKey: Uint8Array<ArrayBuffer>;
  try {
    applicationServerKey = base64UrlToBytes(publicKey);
  } catch {
    return fail("server-disabled", MESSAGES["server-disabled"]);
  }

  let subscription: PushSubscription | null = null;
  try {
    subscription = await registration.pushManager.getSubscription();
    if (
      subscription &&
      !sameKey(subscription.options.applicationServerKey, applicationServerKey)
    ) {
      // Subscribed with an older server key: pushes would be refused.
      await subscription.unsubscribe();
      subscription = null;
    }
    subscription ??= await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  } catch (error) {
    console.warn("Push subscription failed:", error);
    return fail("subscribe-failed", MESSAGES["subscribe-failed"]);
  }

  const json = subscription.toJSON();
  const saved = await apiRequest("/push/subscribe", {
    method: "POST",
    auth: true,
    body: {
      endpoint: subscription.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    },
  });
  if (!saved.ok) {
    // The backend does not know this subscription: do not keep it, or the
    // settings would say 已開啟 while nothing arrives.
    await subscription.unsubscribe().catch(() => false);
    const disabled = saved.httpStatus === 503 || saved.status === 5000;
    return disabled
      ? fail("server-disabled", MESSAGES["server-disabled"])
      : fail("api", saved.message);
  }
  return { ok: true };
}

/**
 * Stops push on this browser: tells the backend and unsubscribes. The
 * local unsubscribe happens even when the backend call fails (the backend
 * then drops the subscription on its next send, which answers 410).
 */
export async function disablePush(token?: string | null): Promise<PushResult> {
  const subscription = await existingSubscription();
  if (!subscription) {
    return { ok: true };
  }
  // Both at once: on logout the page navigates away right after.
  const [result] = await Promise.all([
    apiRequest("/push/subscribe", {
      method: "DELETE",
      ...(token ? { token } : { auth: true }),
      body: { endpoint: subscription.endpoint },
    }),
    subscription.unsubscribe().catch(() => false),
  ]);
  if (!result.ok && result.kind !== "not-found") {
    console.warn("Push unsubscribe was not saved:", result.message);
  }
  return { ok: true };
}

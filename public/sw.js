// MDSIG service worker: web push only (api-contract-v4 §2.3).
//
// It has no fetch handler and caches nothing, so pages, the API and Next.js
// assets always come from the network exactly as without it. Registered
// from modules/push in production builds only, scope "/".

const DEFAULT_TITLE = "MDSIG";
const ICON = "/icons/pwa-192.png";
const BADGE = "/icons/pwa-badge-96.png";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/** Same-site path to open; anything else falls back to the home page. */
function sameSiteUrl(value) {
  try {
    const url = new URL(
      typeof value === "string" && value ? value : "/",
      self.location.origin,
    );
    if (url.origin !== self.location.origin) {
      return `${self.location.origin}/`;
    }
    return url.href;
  } catch {
    return `${self.location.origin}/`;
  }
}

function readPayload(event) {
  if (!event.data) {
    return {};
  }
  try {
    const data = event.data.json();
    return data && typeof data === "object" ? data : {};
  } catch {
    return { body: event.data.text() };
  }
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  const title =
    typeof payload.title === "string" && payload.title
      ? payload.title
      : DEFAULT_TITLE;
  const options = {
    body: typeof payload.body === "string" ? payload.body : "你有一則新通知",
    icon: ICON,
    badge: BADGE,
    lang: "zh-Hant-TW",
    data: { url: sameSiteUrl(payload.url) },
  };
  if (typeof payload.tag === "string" && payload.tag) {
    // Same tag replaces the earlier notification (e.g. likes on one post).
    options.tag = payload.tag;
    options.renotify = true;
  }
  event.waitUntil(self.registration.showNotification(title, options));
});

async function openUrl(url) {
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of windows) {
    if (client.url === url && "focus" in client) {
      return client.focus();
    }
  }
  for (const client of windows) {
    if (new URL(client.url).origin === self.location.origin) {
      try {
        const focused = await client.focus();
        if ("navigate" in focused) {
          const navigated = await focused.navigate(url);
          if (navigated) {
            return navigated;
          }
        }
      } catch {
        // Not controlled by this worker: open a new window below.
      }
      break;
    }
  }
  return self.clients.openWindow(url);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = sameSiteUrl(event.notification.data?.url);
  event.waitUntil(openUrl(url));
});

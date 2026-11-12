import { storageGetJSON, storageSet } from "@/utils/safeStorage";

// Site banners (公告橫幅, contract v4 §5.4): one slim message under the
// header, chosen by the backend (`GET /site/banner`: the newest banner
// whose window includes now, or null). Shared by the site
// (components/SiteBanner) and the admin page's preview.

export type BannerLevel = "info" | "warning" | "success";

export type SiteBannerData = {
  _id: string;
  message: string;
  /** "" (none), a site path or an https URL. */
  link?: string;
  level: BannerLevel;
  startAt?: string | null;
  endAt?: string | null;
};

export const BANNER_MESSAGE_MAX = 200;

export const BANNER_LEVELS: { id: BannerLevel; label: string }[] = [
  { id: "info", label: "一般資訊" },
  { id: "warning", label: "注意" },
  { id: "success", label: "好消息" },
];

/**
 * Colours from the status tokens: a pale tint, a matching border and a
 * coloured icon; the text stays in the ink colours for contrast.
 */
export const BANNER_STYLE: Record<
  BannerLevel,
  { band: string; icon: string; link: string }
> = {
  info: {
    band: "border-brand-700/15 bg-brand-50",
    icon: "text-brand-700",
    link: "text-brand-800",
  },
  warning: {
    band: "border-warm-600/25 bg-warm-50",
    icon: "text-warm-600",
    link: "text-ink-900",
  },
  success: {
    band: "border-ok-700/20 bg-ok-50",
    icon: "text-ok-700",
    link: "text-ok-700",
  },
};

export function isBannerLevel(value: unknown): value is BannerLevel {
  return value === "info" || value === "warning" || value === "success";
}

/**
 * Where the banner leads: a site path (not `//host`) is followed in the
 * app, an https URL opens in a new tab; anything else is ignored.
 */
export function bannerLink(
  link: string | null | undefined,
): { href: string; external: boolean } | null {
  const value = link?.trim();
  if (!value) {
    return null;
  }
  if (value.startsWith("/")) {
    if (value.startsWith("//") || value.includes("\\")) {
      return null;
    }
    return { href: value, external: false };
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname || url.username) {
      return null;
    }
    return { href: url.toString(), external: true };
  } catch {
    return null;
  }
}

/** A banner as the API sent it, or null when it is not one. */
export function readBanner(value: unknown): SiteBannerData | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const banner = value as Record<string, unknown>;
  if (typeof banner._id !== "string" || typeof banner.message !== "string") {
    return null;
  }
  const message = banner.message.trim();
  if (!message) {
    return null;
  }
  return {
    _id: banner._id,
    message,
    link: typeof banner.link === "string" ? banner.link : "",
    level: isBannerLevel(banner.level) ? banner.level : "info",
    startAt: typeof banner.startAt === "string" ? banner.startAt : null,
    endAt: typeof banner.endAt === "string" ? banner.endAt : null,
  };
}

/** Whether the banner's window includes `now` (the API caches 60 s). */
export function bannerIsLive(
  banner: Pick<SiteBannerData, "startAt" | "endAt">,
  now: number = Date.now(),
) {
  const start = banner.startAt ? new Date(banner.startAt).getTime() : 0;
  const end = banner.endAt ? new Date(banner.endAt).getTime() : Infinity;
  return (
    (Number.isNaN(start) || start <= now) && (Number.isNaN(end) || now < end)
  );
}

// ---- Dismissed banners (per browser) ------------------------------------

const DISMISSED_KEY = "mdsig-dismissed-banners";
/** Enough to cover every banner that could still be showing. */
const DISMISSED_KEEP = 30;

export function dismissedBanners(): string[] {
  const value = storageGetJSON<unknown>(DISMISSED_KEY);
  return Array.isArray(value)
    ? value.filter((id): id is string => typeof id === "string")
    : [];
}

export function dismissBanner(id: string) {
  const ids = dismissedBanners().filter((item) => item !== id);
  ids.push(id);
  storageSet(DISMISSED_KEY, JSON.stringify(ids.slice(-DISMISSED_KEEP)));
}

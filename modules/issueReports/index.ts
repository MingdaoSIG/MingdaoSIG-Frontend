import packageJSON from "@/package.json";

// 問題回報 (contract v4 §7): signed-in users report bugs, suggestions and
// account problems on /report and follow them on /me/reports; admins
// handle them on /admin/issue-reports. It replaces the old Google Form.

export const ISSUE_CATEGORIES = [
  "bug",
  "suggestion",
  "account",
  "other",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_CATEGORY_LABEL: Record<IssueCategory, string> = {
  bug: "錯誤",
  suggestion: "建議",
  account: "帳號問題",
  other: "其他",
};

export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  open: "待處理",
  in_progress: "處理中",
  resolved: "已解決",
  closed: "不處理",
};

/** The backend's limits (characters are code points, after trimming). */
export const ISSUE_TITLE_MAX = 80;
export const ISSUE_DESCRIPTION_MAX = 2000;
export const ISSUE_REPLY_MAX = 1000;
export const ISSUE_IMAGES_MAX = 3;

/** What the browser attaches, each a short string (contract v4 §7). */
export type IssueContext = {
  pageUrl: string;
  appVersion: string;
  userAgent: string;
  viewport: string;
  errorDigest: string;
};

const CONTEXT_LIMITS: Record<keyof IssueContext, number> = {
  pageUrl: 500,
  appVersion: 40,
  userAgent: 400,
  viewport: 20,
  errorDigest: 200,
};

export type IssueReport = {
  _id: string;
  category: IssueCategory;
  title: string;
  description: string;
  /** Image ids from POST /image. */
  images: string[];
  context: IssueContext;
  status: IssueStatus;
  reply: string;
  repliedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

/** The frontend version, as /info shows it (package.json). */
export const APP_VERSION: string = packageJSON.version;

/** Code points, the way the backend counts. */
export function textLength(value: string) {
  return Array.from(value).length;
}

function clip(value: string, max: number) {
  const chars = Array.from(value.trim());
  return chars.length > max ? chars.slice(0, max).join("") : chars.join("");
}

export function isIssueCategory(value: unknown): value is IssueCategory {
  return (
    typeof value === "string" &&
    (ISSUE_CATEGORIES as readonly string[]).includes(value)
  );
}

export function isIssueStatus(value: unknown): value is IssueStatus {
  return (
    typeof value === "string" &&
    (ISSUE_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * A same-site path (`/post/…?x=1`) from `?from=` or a same-origin URL,
 * else "". Other sites, `//host` and `javascript:` give "".
 */
export function sameSitePath(value: string | null | undefined, origin: string) {
  if (!value) {
    return "";
  }
  const raw = value.trim();
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) {
    return raw;
  }
  try {
    const url = new URL(raw);
    if (url.origin !== origin) {
      return "";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "";
  }
}

/**
 * What goes with a report: the page it is about (`from`, else a
 * same-origin referrer), the version, the browser and the window size,
 * and the error code from an error page. Browser only.
 */
export function collectContext({
  from,
  digest,
}: {
  from: string | null;
  digest: string | null;
}): IssueContext {
  const origin = window.location.origin;
  const page =
    sameSitePath(from, origin) || sameSitePath(document.referrer, origin);
  return {
    pageUrl: clip(page, CONTEXT_LIMITS.pageUrl),
    appVersion: clip(APP_VERSION, CONTEXT_LIMITS.appVersion),
    userAgent: clip(navigator.userAgent, CONTEXT_LIMITS.userAgent),
    viewport: clip(
      `${window.innerWidth}x${window.innerHeight}`,
      CONTEXT_LIMITS.viewport,
    ),
    errorDigest: clip(digest ?? "", CONTEXT_LIMITS.errorDigest),
  };
}

/** 「1440×900」 for people; the backend stores 「1440x900」. */
export function formatViewport(value: string) {
  return value.replace("x", "×");
}

/**
 * The link to the report form. Pass the page the user is on as `from`
 * (`usePathname()` plus the query), so the report says where it happened.
 */
export function issueReportHref({
  category,
  from,
  digest,
}: {
  category?: IssueCategory;
  from?: string | null;
  digest?: string | null;
} = {}) {
  const params = new URLSearchParams();
  if (category) {
    params.set("category", category);
  }
  if (from) {
    params.set("from", from);
  }
  if (digest) {
    params.set("digest", digest);
  }
  const query = params.toString();
  return query ? `/report?${query}` : "/report";
}

/** 2026/11/13 14:05 in Asia/Taipei. */
export function formatIssueDate(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Taipei",
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

/** A report as the backend sends it, with every field filled in. */
export function normalizeIssueReport(value: unknown): IssueReport | null {
  if (!isRecord(value) || typeof value._id !== "string") {
    return null;
  }
  const context = isRecord(value.context) ? value.context : {};
  return {
    _id: value._id,
    category: isIssueCategory(value.category) ? value.category : "other",
    title: str(value.title),
    description: str(value.description),
    images: Array.isArray(value.images)
      ? value.images.filter((id): id is string => typeof id === "string")
      : [],
    context: {
      pageUrl: str(context.pageUrl),
      appVersion: str(context.appVersion),
      userAgent: str(context.userAgent),
      viewport: str(context.viewport),
      errorDigest: str(context.errorDigest),
    },
    status: isIssueStatus(value.status) ? value.status : "open",
    reply: str(value.reply),
    repliedAt: str(value.repliedAt) || null,
    createdAt: str(value.createdAt) || null,
    updatedAt: str(value.updatedAt) || null,
  };
}

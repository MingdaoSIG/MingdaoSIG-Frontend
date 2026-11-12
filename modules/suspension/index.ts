// Mutes and bans (停權 / 禁言, contract v4 §5.1).
//
// - A mute refuses posting, editing, commenting, liking, joining a SIG,
//   event RSVPs and teacher feedback with 403/4041; reading, reporting,
//   bookmarks and drafts still work.
// - A ban refuses every request that carries a JWT, and `/login`, with
//   403/4041. The site then behaves as for a logged-out visitor.
//
// `/user/me` carries `suspension` while one is in force, and every 4041
// carries `data: { type, until, reason }`. Both feed one small store, so
// the banner (components/SiteBanner/SuspensionBanner) and the refusal
// messages agree. Nothing here uses React, so `modules/api/client` can
// report what it sees.

export type SuspensionType = "mute" | "ban";

export type Suspension = {
  type: SuspensionType;
  /** ISO date; null means no end. */
  until: string | null;
  reason: string;
  /** Who set it (admin pages only). */
  by?: string;
  createdAt?: string | null;
};

export const SUSPENSION_REASON_MAX = 200;

export const SUSPENSION_LABEL: Record<SuspensionType, string> = {
  mute: "禁言",
  ban: "停權",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isType(value: unknown): value is SuspensionType {
  return value === "mute" || value === "ban";
}

/**
 * The suspension if `value` holds one that is still in force, else null.
 * A `until` that is not a date counts as no end, like the backend.
 */
export function activeSuspension(
  value: unknown,
  now: number = Date.now(),
): Suspension | null {
  if (!isRecord(value) || !isType(value.type)) {
    return null;
  }
  let until: string | null = null;
  if (typeof value.until === "string" && value.until) {
    const time = new Date(value.until).getTime();
    if (!Number.isNaN(time)) {
      if (time <= now) {
        return null;
      }
      until = value.until;
    }
  }
  return {
    type: value.type,
    until,
    reason: typeof value.reason === "string" ? value.reason.trim() : "",
    by: typeof value.by === "string" ? value.by : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null,
  };
}

/** 2026/11/20 18:00 in Asia/Taipei, like the backend's notices. */
export function formatSuspensionUntil(until: string | null) {
  if (!until) {
    return "";
  }
  const date = new Date(until);
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

/** 「至 2026/11/20 18:00」 or 「（無限期）」. */
function untilText(suspension: Pick<Suspension, "until">) {
  const until = formatSuspensionUntil(suspension.until);
  return until ? `至 ${until}` : "（無限期）";
}

/** The banner sentence: 「你的帳號已被禁言至 2026/11/20 18:00」. */
export function suspensionHeadline(suspension: Suspension) {
  return `你的帳號已被${SUSPENSION_LABEL[suspension.type]}${untilText(suspension)}`;
}

/**
 * What a refused action says (toasts, dialogs, inline errors). `type` may
 * be unknown when an old backend leaves it out.
 */
export function suspensionRefusal(suspension: Partial<Suspension> | null) {
  const until = formatSuspensionUntil(suspension?.until ?? null);
  const period = until
    ? `（至 ${until}）`
    : suspension?.type
      ? "（無限期）"
      : "";
  if (suspension?.type === "ban") {
    return `你的帳號已被停權${period}，暫時不能使用需要登入的功能`;
  }
  if (suspension?.type === "mute") {
    return `你的帳號已被禁言${period}，暫時不能發文、留言、按讚、申請加入 SIG 或報名活動`;
  }
  return `你的帳號已被限制使用${period}，暫時不能執行這個操作`;
}

/**
 * The suspension a 4041 response describes. `fallbackType` is used when
 * the body does not say (a refused GET or /login can only be a ban).
 */
export function suspensionFromFailure(
  body: unknown,
  fallbackType: SuspensionType | null,
): Partial<Suspension> {
  const data = isRecord(body) && isRecord(body.data) ? body.data : {};
  const type = isType(data.type) ? data.type : fallbackType;
  const until =
    typeof data.until === "string" && data.until ? data.until : null;
  return {
    ...(type ? { type } : {}),
    until,
    reason: typeof data.reason === "string" ? data.reason.trim() : "",
  };
}

// ---- The store ---------------------------------------------------------

let current: Suspension | null = null;
const listeners = new Set<() => void>();

function same(a: Suspension | null, b: Suspension | null) {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.type === b.type && a.until === b.until && a.reason === b.reason;
}

/** The suspension last reported for this browser tab (or null). */
export function getReportedSuspension() {
  return current;
}

/**
 * Records what the backend said about the signed-in account: its profile
 * (`/user/me`, `/login`) or a 4041. Null clears it (a profile without one,
 * or logging out). Listeners run only when it changes.
 */
export function reportSuspension(value: Partial<Suspension> | null) {
  const next = value?.type ? activeSuspension(value) : null;
  if (same(current, next)) {
    return;
  }
  current = next;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeSuspension(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Dates and numbers in the admin panel, in Taiwan's format.

function toDate(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 2026/11/12 */
export function formatDate(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) {
    return "—";
  }
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** 2026/11/12 14:05 */
export function formatDateTime(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) {
    return "—";
  }
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** 剛剛 / 5 分鐘前 / 3 小時前 / 2 天前 / 2026/10/01 */
export function formatRelative(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) {
    return "—";
  }
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) {
    return "剛剛";
  }
  if (minutes < 60) {
    return `${minutes} 分鐘前`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} 小時前`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} 天前`;
  }
  return formatDate(value);
}

/** Whole days since the date (0 for today). */
export function daysSince(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) {
    return null;
  }
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

export function formatCount(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }
  return value.toLocaleString("zh-TW");
}

/** YYYY-MM-DD in local time, for <input type="date">. */
export function toDateInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const IDENTITY_LABEL: Record<string, string> = {
  teacher: "老師",
  student: "學生",
  alumni: "校友",
};

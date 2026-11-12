/**
 * 驗證 MongoDB ObjectId 格式（24 字元十六進位）
 */
export function isValidObjectId(id: string): boolean {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
}

/**
 * Custom id characters, as the backend checks them (CheckValidCustomId):
 * lowercase letters, digits and "_", in parts joined by single dots,
 * e.g. "tim.chou" or "literature_history_and_philosophy".
 */
const CUSTOM_ID_PATTERN = /^[a-z0-9_]+(\.[a-z0-9_]+)*$/;

/**
 * The backend caps user-chosen ids at 25 characters, but SIG ids are set by
 * hand and run longer (33 today), so the route allows more.
 */
const CUSTOM_ID_MAX_LENGTH = 50;

/**
 * 驗證自訂義 ID 格式（以 @ 開頭，例如 /@tim.chou）
 */
export function isValidCustomId(id: string): boolean {
  if (!id.startsWith("@")) {
    return false;
  }
  const customId = id.slice(1);
  return (
    customId.length >= 1 &&
    customId.length <= CUSTOM_ID_MAX_LENGTH &&
    CUSTOM_ID_PATTERN.test(customId)
  );
}

/**
 * 驗證並清理 URL 參數，防止路徑遍歷
 */
export function sanitizeUrlParam(param: string): string {
  // 移除任何可能導致路徑遍歷的字符
  return param
    .replace(/\.\./g, "") // 移除 ..
    .replace(/[<>"'`|;{}[\]]/g, ""); // 移除特殊字符
}

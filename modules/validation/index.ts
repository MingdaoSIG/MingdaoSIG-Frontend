/**
 * 驗證 MongoDB ObjectId 格式（24 字元十六進位）
 */
export function isValidObjectId(id: string): boolean {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
}

/**
 * 驗證自訂義使用者 ID 格式（以 @ 開頭，後接英數字、底線和連字符）
 */
export function isValidCustomId(id: string): boolean {
  // 以 @ 開頭，後接 1-30 個英數字、底線或連字符
  const customIdRegex = /^@[a-zA-Z0-9_-]{1,30}$/;
  return customIdRegex.test(id);
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

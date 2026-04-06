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
 * 驗證 SIG ID 格式（可以是 ObjectId 或自訂義 ID）
 */
export function isValidSigId(id: string): boolean {
  return isValidObjectId(id) || isValidCustomId(id);
}

/**
 * 驗證 UUID v4 格式
 */
export function isValidUUID(uuid: string): boolean {
  const uuidV4Regex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidV4Regex.test(uuid);
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

/**
 * 驗證電子郵件是否為明道中學網域
 */
export function isMingdaoEmail(email: string): boolean {
  return email.endsWith("@ms.mingdao.edu.tw");
}

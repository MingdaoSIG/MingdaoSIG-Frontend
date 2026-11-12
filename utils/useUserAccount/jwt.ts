// Reads the `exp` claim of a platform JWT without verifying it (the backend
// verifies). Tokens issued before the backend added `exp` have none and stay
// valid until the backend rejects them.

/** Treat a token as expired this long before it really is. */
const EXPIRY_MARGIN_MS = 60 * 1000;

function decodePayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload: unknown = JSON.parse(atob(padded));
    if (typeof payload !== "object" || payload === null) {
      return null;
    }
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** True when the token is well-formed and not (about to be) expired. */
export function isJwtUsable(token: string, now: number = Date.now()) {
  const payload = decodePayload(token);
  if (!payload) {
    return false;
  }
  if (typeof payload.exp !== "number") {
    return true;
  }
  return payload.exp * 1000 > now + EXPIRY_MARGIN_MS;
}

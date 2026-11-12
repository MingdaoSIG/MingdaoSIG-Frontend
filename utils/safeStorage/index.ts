// localStorage wrappers that never throw. Safari with "Block all cookies"
// (and some private modes) throws on any localStorage access; the app must
// keep working, it just cannot remember things between visits.

export function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function storageRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable: nothing to remove
  }
}

/** Parsed JSON value, or null when missing, blocked or malformed. */
export function storageGetJSON<T>(key: string): T | null {
  const raw = storageGet(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// sessionStorage: survives the Google sign-in redirect in the same tab,
// but not closing the tab. Same never-throw contract as above.

export function sessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function sessionSet(key: string, value: string): boolean {
  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function sessionRemove(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage unavailable: nothing to remove
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * A displayable URL for an image field. The backend stores covers and
 * avatars in three shapes: a full URL (Google avatars, older uploads), a
 * `/image/<id>` path, or a bare image id from `POST /image` (SIG avatars
 * saved by `POST /sig/:id`). Local paths such as `/images/…` stay as they
 * are. Empty values give undefined, so callers pick their own fallback.
 */
export function imageUrl(value: string | null | undefined): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  const src = value.trim();
  if (src.startsWith("http://") || src.startsWith("https://")) {
    // Covers uploaded through the old lazco.dev host now live on the API.
    if (src.includes("lazco.dev")) {
      const pathPart = src.split("lazco.dev/")[1] || "";
      return `${API_URL}/${pathPart}`;
    }
    return src;
  }
  if (src.startsWith("/image/")) {
    return `${API_URL}${src}`;
  }
  if (src.startsWith("/") || src.startsWith("blob:")) {
    return src;
  }
  return `${API_URL}/image/${src}`;
}

/** Default avatar served by the API (the one the profile pages used). */
export const DEFAULT_AVATAR_URL = `${API_URL}/image/653299930b891d1f6b5b4458`;

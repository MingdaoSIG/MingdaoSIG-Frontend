import { apiRequest } from "@/modules/api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function imageUpload(file: BodyInit, token: string | null) {
  return fetch(`${API_URL}/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: file,
  });
}

export const UPLOAD_IMAGE_TYPES = [
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/tiff",
];
/** Same cap as the post editor (the backend allows 5 MiB). */
export const UPLOAD_IMAGE_MAX_BYTES = 5 * 1000 * 1000;

/** Why a picked file cannot be uploaded, or null when it can. */
export function imageFileProblem(file: File) {
  if (!UPLOAD_IMAGE_TYPES.includes(file.type)) {
    return "只接受 JPG、PNG、WebP 或 TIFF 圖片";
  }
  if (file.size > UPLOAD_IMAGE_MAX_BYTES) {
    return "圖片不能超過 5 MB";
  }
  return null;
}

/**
 * Uploads an image as the signed-in user and resolves to its id
 * (`POST /image` answers `{ status: 2000, id }`).
 */
export async function uploadImageId(
  file: File,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const result = await apiRequest("/image", {
    method: "POST",
    body: file,
    auth: true,
  });
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.kind === "too-large"
          ? "圖片太大，請換一張較小的圖片"
          : result.message,
    };
  }
  const id = result.body.id;
  if (typeof id !== "string" || !id) {
    return { ok: false, message: "伺服器暫時無法回應，請稍後再試" };
  }
  return { ok: true, id };
}

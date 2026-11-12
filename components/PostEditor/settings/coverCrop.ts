// 16:9 cover crops on the client (v4 8B). There is no focal point on the
// backend, so the uploaded image is the crop itself.

export const COVER_ASPECT = 16 / 9;
const OUTPUT_MAX_WIDTH = 1600;

/**
 * Where the crop sits: `zoom` ≥ 1 (1 = the image just covers the frame),
 * `x` / `y` from 0 (left / top edge) to 1 (right / bottom edge).
 */
export type CoverCrop = { zoom: number; x: number; y: number };

export const CENTER_CROP: CoverCrop = { zoom: 1, x: 0.5, y: 0.5 };

/** The crop rectangle in the image's own pixels. */
export function cropRect(width: number, height: number, crop: CoverCrop) {
  // The largest 16:9 box that fits, shrunk by the zoom.
  const fullWidth = Math.min(width, height * COVER_ASPECT);
  const sw = fullWidth / crop.zoom;
  const sh = sw / COVER_ASPECT;
  return {
    sx: (width - sw) * crop.x,
    sy: (height - sh) * crop.y,
    sw,
    sh,
  };
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("圖片讀取失敗"));
    image.src = url;
  });
}

/**
 * The 16:9 region as a WebP file (PNG where the browser cannot write
 * WebP), at most 1600 px wide.
 */
export async function cropToFile(
  image: HTMLImageElement,
  crop: CoverCrop,
): Promise<File> {
  const { sx, sy, sw, sh } = cropRect(
    image.naturalWidth,
    image.naturalHeight,
    crop,
  );
  const width = Math.max(1, Math.round(Math.min(OUTPUT_MAX_WIDTH, sw)));
  const height = Math.max(1, Math.round(width / COVER_ASPECT));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("無法裁切圖片");
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.88),
  );
  if (!blob) {
    throw new Error("無法裁切圖片");
  }
  const type = blob.type || "image/png";
  const extension = type === "image/webp" ? "webp" : "png";
  return new File([blob], `cover.${extension}`, { type });
}

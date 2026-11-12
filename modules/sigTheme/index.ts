import { sigDefaultColors } from "@/components/Threads/configs/sigDefaultColors";
import type { Sig } from "@/interfaces/Sig";
import { apiRequest } from "@/modules/api/client";
import { FALLBACK_DEFAULT_COVERS } from "./fallbackCovers";

// SIG colours and default covers come from the API (`color`, `defaultCover`
// on every SIG read, contract v4 §3.7). The tables that used to be the
// only source (components/Threads/configs/sigDefaultColors.ts, the
// dashboard's and the editors' copies) are kept as the fallback for a SIG
// the API has no value for.

/** The brand colour, for a SIG with no colour anywhere. */
export const BRAND_COLOR = "#0b5a83";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

type SigLike = { _id?: string; color?: string } | null | undefined;

function hasColor(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * A SIG's accent colour: the SIG's own `color`, else the one the SIG
 * directory (`/sig/list`) has for that id, else the old table. Undefined
 * when none of them knows the SIG.
 */
export function resolveSigColor(
  sig: SigLike | string,
  directory?: Map<string, Pick<Sig, "_id" | "color">>,
): string | undefined {
  const id = typeof sig === "string" ? sig : sig?._id;
  const own = typeof sig === "string" ? undefined : sig?.color;
  if (hasColor(own)) {
    return own;
  }
  if (!id) {
    return undefined;
  }
  const listed = directory?.get(id)?.color;
  if (hasColor(listed)) {
    return listed;
  }
  return sigDefaultColors[id];
}

/** `#rrggbb` or `rgb(r, g, b)` with an alpha, for chart fills. */
export function withAlpha(color: string, alpha: number) {
  if (HEX_COLOR.test(color)) {
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const [r, g, b] = rgb[1].split(",").map((part) => part.trim());
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

// ---- Default covers (the editors) ------------------------------------

const DIRECTORY_TTL = 5 * 60 * 1000;
let directoryCache: { at: number; sigs: Sig[] } | null = null;

function isSig(value: unknown): value is Sig {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Sig)._id === "string"
  );
}

async function findSig(sigId: string): Promise<Sig | null> {
  if (!directoryCache || Date.now() - directoryCache.at > DIRECTORY_TTL) {
    const list = await apiRequest<unknown[]>("/sig/list");
    if (list.ok && Array.isArray(list.data)) {
      directoryCache = { at: Date.now(), sigs: list.data.filter(isSig) };
    }
  }
  const listed = directoryCache?.sigs.find((sig) => sig._id === sigId);
  if (listed) {
    return listed;
  }
  // The announcement SIG (stored as removed) is not in /sig/list.
  const single = await apiRequest<unknown>(`/sig/${sigId}`);
  return single.ok && isSig(single.data) ? single.data : null;
}

/**
 * The cover for a post published without one: the SIG's `defaultCover`
 * from the API, else the old table, else "" (the backend then applies its
 * own default).
 */
export async function sigDefaultCover(sigId: string): Promise<string> {
  if (!sigId) {
    return "";
  }
  const sig = await findSig(sigId).catch(() => null);
  if (sig && typeof sig.defaultCover === "string" && sig.defaultCover) {
    return sig.defaultCover;
  }
  return FALLBACK_DEFAULT_COVERS[sigId] ?? "";
}

/** Forget the cached directory (after an admin changed a SIG). */
export function forgetSigDirectory() {
  directoryCache = null;
}

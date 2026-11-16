import { HELP_IMAGE_SIZES } from "./images";
import type { HelpImage } from "./types";

/** A screenshot in public/help/, or nothing when it is not there. */
export function helpImage(name: string, alt: string): HelpImage | undefined {
  const size = HELP_IMAGE_SIZES[name];
  if (!size) {
    return undefined;
  }
  return { src: `/help/${name}.webp`, alt, width: size[0], height: size[1] };
}

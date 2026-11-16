import type { HelpStep } from "@/modules/help/types";
import { HelpText } from "./HelpText";

// Numbered steps with optional screenshots (lazy-loaded WebP from
// public/help/). `idPrefix` gives each step an anchor (`#step-2`).

export function GuideSteps({
  steps,
  idPrefix,
  compact = false,
  labelFor,
}: {
  steps: HelpStep[];
  idPrefix?: string;
  /** Drawers: smaller numbers, no pictures. */
  compact?: boolean;
  /** A small label before a step (who it is for). */
  labelFor?: (step: HelpStep) => string | null;
}) {
  return (
    <ol className={`flex flex-col ${compact ? "gap-2.5" : "gap-5"}`}>
      {steps.map((step, index) => (
        <li
          key={step.text}
          id={idPrefix ? `${idPrefix}${index + 1}` : undefined}
          className="flex scroll-mt-4 gap-3 lg:scroll-mt-[var(--shell-top)]"
        >
          <span
            aria-hidden
            className={`flex shrink-0 items-center justify-center rounded-full bg-brand-700 font-bold text-white tabular-nums ${
              compact ? "mt-0.5 size-5 text-[11px]" : "mt-0.5 size-7 text-sm"
            }`}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`text-ink-800 ${
                compact
                  ? "text-sm leading-6"
                  : "text-[0.9375rem] leading-[1.75]"
              }`}
            >
              <span className="sr-only">第 {index + 1} 步：</span>
              {labelFor?.(step) && (
                <span className="mr-1.5 inline-flex rounded-chip bg-field px-1.5 align-[1px] font-semibold text-[11px] text-ink-500 leading-5">
                  {labelFor(step)}
                </span>
              )}
              <HelpText text={step.text} />
            </p>
            {step.image && !compact && (
              <figure className="mt-3">
                {/* biome-ignore lint/performance/noImgElement: static WebP, lazy */}
                <img
                  src={step.image.src}
                  alt={step.image.alt}
                  width={step.image.width}
                  height={step.image.height}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full max-w-[40rem] rounded-control border border-line bg-field shadow-card"
                />
              </figure>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

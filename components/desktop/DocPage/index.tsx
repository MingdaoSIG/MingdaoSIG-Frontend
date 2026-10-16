import type { ReactNode } from "react";

// Single-column desktop page (docs/redesign/redesign-2026.md §3). Like
// <SplitBlock> it fills the shell's content row: the header card stays put
// and the content below scrolls on its own (see `.layout-doc` in globals.css).

export function DocPage({
  title,
  description,
  actions,
  width = "wide",
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  width?: "wide" | "narrow";
  children: ReactNode;
}) {
  return (
    <main
      className={`layout-doc mx-auto flex h-full min-h-0 flex-col gap-4 ${
        width === "wide"
          ? "w-[min(80rem,100%-4rem)]"
          : "w-[min(56rem,100%-4rem)]"
      }`}
    >
      <header className="flex shrink-0 items-center gap-4 rounded-card border border-line bg-surface px-6 py-5 shadow-card">
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-2xl text-ink-900 leading-[1.4] tracking-[0.01em]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-ink-500 text-sm">{description}</p>
          )}
        </div>
        {actions}
      </header>
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {children}
      </div>
    </main>
  );
}

export function DocCard({
  title,
  className = "",
  children,
}: {
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-card border border-line bg-surface p-6 shadow-card ${className}`}
    >
      {title && (
        <h2 className="mb-4 font-bold text-ink-900 text-lg leading-7">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export const docLink =
  "text-brand-700 underline decoration-brand-700/30 underline-offset-[0.2em] transition-colors hover:text-brand-800 hover:decoration-current";

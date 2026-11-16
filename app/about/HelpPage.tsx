import type { ReactNode } from "react";

// One page of the help centre: a title card and the content. Text pages
// keep a readable measure; 平台數據 and 運行狀態 use the full width.

export function HelpPage({
  title,
  description,
  actions,
  wide = false,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <article
      className={`flex w-full min-w-0 flex-col gap-4 ${wide ? "" : "lg:max-w-[52rem]"}`}
    >
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-card border border-line bg-surface px-4 py-4 shadow-card lg:px-6 lg:py-5">
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-ink-900 text-xl leading-[1.4] lg:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-ink-500 text-sm leading-6">{description}</p>
          )}
        </div>
        {actions}
      </header>
      {children}
    </article>
  );
}

export function HelpCard({
  title,
  id,
  action,
  children,
  className = "",
}: {
  title?: string;
  id?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={title && id ? `${id}-title` : undefined}
      className={`scroll-mt-4 rounded-card border border-line bg-surface p-4 shadow-card lg:scroll-mt-[var(--shell-top)] lg:p-6 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && (
            <h2
              id={id ? `${id}-title` : undefined}
              className="font-bold text-ink-900 text-lg leading-7"
            >
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

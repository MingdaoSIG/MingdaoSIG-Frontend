"use client";

import type { ReactNode } from "react";

/** The white card around a list, with a footer that stays in view. */
export function ListCard({
  toolbar,
  children,
  footer,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-surface shadow-card">
      {toolbar && (
        <div className="border-line border-b px-3 py-3 lg:px-4">{toolbar}</div>
      )}
      {children}
      {footer && (
        <div className="sticky bottom-0 z-10 flex flex-col gap-2 rounded-b-card border-line border-t bg-surface px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center lg:px-4 lg:pb-2.5">
          {footer}
        </div>
      )}
    </section>
  );
}

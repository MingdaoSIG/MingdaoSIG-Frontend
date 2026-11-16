"use client";

import { ArrowRight, CircleHelp, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { FaqAccordion } from "@/components/Help/FaqAccordion";
import { GuideSteps } from "@/components/Help/GuideSteps";
import { adminFaqItems } from "@/modules/help/adminFaq";
import {
  adminGuide,
  guideFor,
  guidesForPath,
  stepsFor,
} from "@/modules/help/adminGuide";
import { useAdmin } from "../context";

// 「？說明」 at the top right of every admin page (decision 4C): a right-
// side drawer with the short guide of this page (the viewer's steps only),
// its questions, and 「完整說明」 on /admin/help. Esc closes it; Tab stays
// inside; focus goes back to the button.

function useGuides() {
  const pathname = usePathname() ?? "/admin";
  const params = useSearchParams();
  const { roles } = useAdmin();
  return guidesForPath(pathname, params.get("tab"))
    .flatMap((id) => {
      const guide = adminGuide(id);
      return guide ? [guide] : [];
    })
    .filter((guide) => guideFor(guide, roles));
}

export function AdminHelpButton() {
  const [open, setOpen] = useState(false);
  const guides = useGuides();
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus({ preventScroll: true });
  }, []);

  if (guides.length === 0) {
    return null;
  }
  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-admin-help
        className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 text-sm transition-colors hover:bg-field"
      >
        <CircleHelp aria-hidden className="size-4 text-brand-700" />
        說明
      </button>
      {open && <HelpDrawer guides={guides} onClose={close} />}
    </>
  );
}

function HelpDrawer({
  guides,
  onClose,
}: {
  guides: ReturnType<typeof useGuides>;
  onClose: () => void;
}) {
  const { roles } = useAdmin();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [main, ...others] = guides;
  const steps = stepsFor(main, roles).slice(0, main.short ?? 3);
  const total = stepsFor(main, roles).length;
  const faq = adminFaqItems(main.faq ?? []).filter((item) =>
    guideFor(item, roles),
  );

  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trap = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !panel.current) {
      return;
    }
    const items = Array.from(
      panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex="0"]',
      ),
    ).filter((element) => element.offsetParent !== null);
    if (items.length === 0) {
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex justify-end">
      <button
        type="button"
        aria-label="關閉說明"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-900/30"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trap}
        data-admin-help-drawer
        className="relative flex h-full w-full max-w-[26rem] flex-col bg-surface shadow-card outline-none"
      >
        <div className="flex items-start gap-2 border-line border-b px-5 py-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-brand-700 text-xs">這一頁怎麼用</p>
            <h2
              id={titleId}
              className="mt-0.5 font-bold text-ink-900 text-lg leading-snug"
            >
              {main.title}
            </h2>
            <p className="mt-1 text-ink-500 text-sm leading-6">
              {main.summary}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉說明"
            className="-mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-500 hover:bg-field"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
          <GuideSteps steps={steps} compact />
          {total > steps.length && (
            <p className="-mt-2 text-ink-500 text-xs">
              還有 {total - steps.length} 個步驟在完整說明裡。
            </p>
          )}
          {faq.length > 0 && (
            <section aria-label="常見問題">
              <h3 className="mb-2 font-bold text-ink-900 text-sm">常見問題</h3>
              <FaqAccordion items={faq} />
            </section>
          )}
          {others.length > 0 && (
            <section aria-label="這一頁的其他說明">
              <h3 className="mb-2 font-bold text-ink-900 text-sm">
                這一頁的其他說明
              </h3>
              <ul className="flex flex-col gap-1">
                {others.map((guide) => (
                  <li key={guide.id}>
                    <Link
                      href={`/admin/help#${guide.id}`}
                      className="text-brand-700 text-sm underline decoration-brand-700/30 underline-offset-[0.2em] hover:text-brand-800"
                    >
                      {guide.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <div className="border-line border-t px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Link
            href={`/admin/help#${main.id}`}
            data-admin-help-full
            className="flex h-10 items-center justify-center gap-1.5 rounded-control bg-brand-700 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
          >
            完整說明
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

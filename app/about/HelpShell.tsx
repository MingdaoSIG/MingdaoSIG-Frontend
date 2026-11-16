"use client";

import {
  Activity,
  BookOpen,
  ChartNoAxesColumn,
  ChevronDown,
  CircleHelp,
  Flag,
  History,
  type LucideIcon,
  Mail,
  Rocket,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { HelpSearch } from "@/components/Help/HelpSearch";
import { ReportStrip } from "@/components/Help/ReportStrip";
import {
  HELP_SECTIONS,
  type HelpSectionId,
  helpSectionFor,
  OLD_ABOUT_ANCHORS,
} from "@/modules/help/sections";
import useIsMobile from "@/utils/useIsMobile";

// The help centre (decision 1B): every /about page inside one frame.
// Desktop: a sticky table of contents on the left (search, the sections,
// and 「找不到答案？回報問題」 at its bottom), the page on the right; the
// window scrolls. Phones: the table of contents is a menu at the top, the
// page scrolls under it and ends with the report strip.
// Old one-page anchors (/about#dashboard…) are sent to their section.

const ICONS: Record<HelpSectionId, LucideIcon> = {
  start: Rocket,
  guide: BookOpen,
  faq: CircleHelp,
  report: Flag,
  rules: ScrollText,
  changelog: History,
  stats: ChartNoAxesColumn,
  status: Activity,
  contact: Mail,
};

function SectionLinks({
  current,
  onNavigate,
}: {
  current: HelpSectionId;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {HELP_SECTIONS.map((section) => {
        const Icon = ICONS[section.id];
        const active = section.id === current;
        return (
          <li key={section.id}>
            <Link
              href={section.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              data-help-toc={section.id}
              className={`flex h-9 items-center gap-2.5 rounded-control px-3 font-semibold text-sm transition-colors ${
                active
                  ? "bg-brand-700/10 text-brand-700"
                  : "text-ink-700 hover:bg-field"
              }`}
            >
              <Icon
                aria-hidden
                className={`size-4 shrink-0 ${active ? "text-brand-700" : "text-ink-400"}`}
              />
              {section.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** /about#info and the other old anchors → the new routes. */
function useOldAnchors(pathname: string) {
  const router = useRouter();
  useEffect(() => {
    const send = () => {
      if (pathname !== "/about") {
        return;
      }
      const hash = decodeURIComponent(window.location.hash.slice(1));
      const target = OLD_ABOUT_ANCHORS[hash];
      if (target) {
        router.replace(target);
      }
    };
    send();
    window.addEventListener("hashchange", send);
    return () => window.removeEventListener("hashchange", send);
  }, [pathname, router]);
}

function MobileShell({
  current,
  children,
}: {
  current: HelpSectionId;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const scroller = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const label =
    HELP_SECTIONS.find((section) => section.id === current)?.label ?? "";

  // A new page starts at its top (unless it links to a part of itself).
  useEffect(() => {
    setOpen(false);
    if (!window.location.hash && scroller.current) {
      scroller.current.scrollTop = 0;
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className="flex h-full flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <div ref={menuRef} className="relative shrink-0">
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls="help-menu"
          onClick={() => setOpen((value) => !value)}
          data-help-menu-button
          className="flex h-12 w-full cursor-pointer items-center gap-2 rounded-card border border-line bg-surface px-4 text-left shadow-card"
        >
          <span className="font-bold text-ink-900">說明中心</span>
          <span aria-hidden className="text-ink-400">
            ·
          </span>
          <span className="min-w-0 flex-1 truncate font-semibold text-brand-700 text-sm">
            {label}
          </span>
          <span className="sr-only">，打開目錄</span>
          <ChevronDown
            aria-hidden
            className={`size-4 shrink-0 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <nav
            id="help-menu"
            aria-label="說明中心目錄"
            className="custom-scrollbar absolute inset-x-0 top-full z-40 mt-1.5 flex max-h-[70dvh] flex-col gap-3 overflow-y-auto rounded-card border border-line bg-surface p-3 shadow-card"
          >
            <HelpSearch onNavigate={() => setOpen(false)} />
            <SectionLinks current={current} onNavigate={() => setOpen(false)} />
          </nav>
        )}
      </div>
      <div
        ref={scroller}
        data-help-scroll
        className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4"
      >
        {children}
        <ReportStrip />
      </div>
    </div>
  );
}

export function HelpShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/about";
  const isMobile = useIsMobile();
  const current = helpSectionFor(pathname).id;
  useOldAnchors(pathname);

  if (isMobile) {
    return <MobileShell current={current}>{children}</MobileShell>;
  }

  return (
    <div className="layout-doc grid w-full grid-cols-[15rem_minmax(0,1fr)] items-start gap-6 px-6 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-8">
      <aside className="custom-scrollbar sticky top-[var(--shell-top)] flex max-h-[calc(100dvh-var(--shell-top)-1rem)] flex-col gap-3 overflow-y-auto pb-2">
        <Link
          href="/about"
          className="px-3 font-bold text-ink-900 text-xl leading-[1.4] hover:text-brand-700"
        >
          說明中心
        </Link>
        <HelpSearch />
        <nav aria-label="說明中心目錄">
          <SectionLinks current={current} />
        </nav>
        <ReportStrip compact />
      </aside>
      <div className="flex min-w-0 flex-col gap-4 pb-8">{children}</div>
    </div>
  );
}

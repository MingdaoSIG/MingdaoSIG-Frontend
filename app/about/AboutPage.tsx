"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useEffect, useRef, useState } from "react";
import useIsMobile from "@/utils/useIsMobile";
import { ChangelogList, ContactLinks, InfoLinks, StatusPanel } from "./sections";

// 關於 MDSIG (v3 8A): 資訊, 平台數據 (Dashboard), 更新紀錄, 運行狀態 and 聯絡
// on one page with a table of contents (anchors). The old pages redirect
// here: /info → #info, /dashboard → #dashboard, /changelog → #changelog
// (next.config.js).

const DashboardPanel = dynamic(() => import("./dashboard/DashboardPanel"), {
  ssr: false,
  loading: () => (
    <div aria-hidden className="h-64 animate-pulse rounded-control bg-field" />
  ),
});

const SECTIONS = [
  { id: "info", label: "資訊" },
  { id: "dashboard", label: "平台數據" },
  { id: "changelog", label: "更新紀錄" },
  { id: "status", label: "運行狀態" },
  { id: "contact", label: "聯絡" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function Section({
  id,
  title,
  children,
}: {
  id: SectionId;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      data-about-section={id}
      className="scroll-mt-4 rounded-card border border-line bg-surface p-4 shadow-card lg:p-6"
    >
      <h2
        id={`${id}-title`}
        className="mb-4 font-bold text-ink-900 text-lg leading-7"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Loads chart.js only when the section comes near the screen. */
function LazyDashboard({ mobile }: { mobile: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const target = ref.current;
    if (!target || visible) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [visible]);
  return (
    <div ref={ref} className="min-h-64">
      {visible ? (
        <DashboardPanel mobile={mobile} />
      ) : (
        <div aria-hidden className="h-64 rounded-control bg-field" />
      )}
    </div>
  );
}

/** The section in view, for the table of contents. */
function useCurrentSection(scroller: React.RefObject<HTMLElement | null>) {
  const [current, setCurrent] = useState<SectionId>("info");
  useEffect(() => {
    const root = scroller.current;
    if (!root) {
      return;
    }
    const onScroll = () => {
      const top = root.getBoundingClientRect().top;
      let found: SectionId = "info";
      for (const { id } of SECTIONS) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top - top <= 80) {
          found = id;
        }
      }
      // The last section may be too short to reach the top.
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 4) {
        found = SECTIONS[SECTIONS.length - 1].id;
      }
      setCurrent(found);
    };
    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [scroller]);
  return current;
}

export default function AboutPage() {
  const isMobile = useIsMobile();
  const scroller = useRef<HTMLDivElement>(null);
  const current = useCurrentSection(scroller);

  // The page renders after hydration, so the browser's own jump to
  // #section found nothing: do it once the sections exist.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (SECTIONS.some((section) => section.id === id)) {
      document.getElementById(id)?.scrollIntoView();
    }
  }, []);

  const toc = (
    <nav aria-label="目錄">
      <ul
        className={
          isMobile
            ? "scrollbar-hide flex gap-1.5 overflow-x-auto"
            : "flex flex-col gap-0.5"
        }
      >
        {SECTIONS.map((section) => {
          const active = section.id === current;
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={active ? "location" : undefined}
                className={`flex items-center rounded-control font-semibold text-sm transition-colors ${
                  isMobile ? "h-9 px-3" : "h-9 px-3"
                } ${
                  active
                    ? "bg-brand-700/10 text-brand-700"
                    : "text-ink-700 hover:bg-field"
                }`}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const sections = (
    <>
      <Section id="info" title="資訊">
        <InfoLinks />
      </Section>
      <Section id="dashboard" title="平台數據">
        <LazyDashboard mobile={isMobile} />
      </Section>
      <Section id="changelog" title="更新紀錄">
        <ChangelogList />
      </Section>
      <Section id="status" title="運行狀態">
        <StatusPanel />
      </Section>
      <Section id="contact" title="聯絡">
        <ContactLinks />
      </Section>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <header className="shrink-0 rounded-card border border-line bg-surface px-4 py-3 shadow-card">
          <h1 className="font-bold text-ink-900 text-xl leading-8">
            關於 MDSIG
          </h1>
          <div className="mt-2">{toc}</div>
        </header>
        <div
          ref={scroller}
          data-about-scroll
          className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4"
        >
          {sections}
        </div>
      </div>
    );
  }

  return (
    <main className="layout-doc mx-auto grid h-full min-h-0 w-[min(64rem,100%-4rem)] grid-cols-[11rem_minmax(0,1fr)] gap-6">
      <aside className="flex flex-col gap-3">
        <h1 className="px-3 font-bold text-2xl text-ink-900 leading-[1.4]">
          關於 MDSIG
        </h1>
        {toc}
      </aside>
      <div
        ref={scroller}
        data-about-scroll
        className="custom-scrollbar flex min-h-0 flex-col gap-4 overflow-y-auto scroll-smooth pr-1 pb-2"
      >
        {sections}
      </div>
    </main>
  );
}

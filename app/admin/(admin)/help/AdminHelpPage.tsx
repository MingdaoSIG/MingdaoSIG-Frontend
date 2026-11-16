"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FaqAccordion } from "@/components/Help/FaqAccordion";
import { GuideSteps } from "@/components/Help/GuideSteps";
import { HelpText } from "@/components/Help/HelpText";
import { ADMIN_FAQ, adminFaqItems } from "@/modules/help/adminFaq";
import { ADMIN_GUIDES, guideFor, stepsFor } from "@/modules/help/adminGuide";
import type { AdminFaqItem, AdminGuide } from "@/modules/help/types";
import type { AdminRole } from "@/utils/useAdminAccess";
import useIsMobile from "@/utils/useIsMobile";
import { PageHeader } from "../components/AdminShell";
import { Badge } from "../components/ui";
import { useAdmin } from "../context";
import { HELP_ROLE_LABEL, HELP_ROLES, roleList, stepLabel } from "./roles";

// 說明與教學 (/admin/help, decision 4C): a guide for every admin feature
// and the FAQ, filtered by role: 全部／管理員／內容管理員／SIG 幹部與老師.
// It opens on the viewer's own roles, so it shows what they can use. The
// 「？說明」 drawers link here (`#<guide id>`, `#faq-<id>`).

type Filter = "all" | AdminRole[];

function defaultFilter(roles: AdminRole[]): Filter {
  return roles.includes("admin") ? "all" : roles;
}

function matches(item: { roles: AdminRole[] }, filter: Filter) {
  return filter === "all" || guideFor(item, filter);
}

function RoleChips({
  filter,
  onChange,
}: {
  filter: Filter;
  onChange: (filter: Filter) => void;
}) {
  const chip = (pressed: boolean) =>
    `flex h-9 cursor-pointer items-center rounded-chip border px-3 font-semibold text-sm transition-colors ${
      pressed
        ? "border-brand-700 bg-brand-50 text-brand-800"
        : "border-line-strong bg-surface text-ink-700 hover:bg-field"
    }`;
  return (
    // biome-ignore lint/a11y/useSemanticElements: a group of toggle buttons
    <div
      role="group"
      aria-label="依身分篩選"
      className="flex flex-wrap gap-2"
      data-help-roles
    >
      <button
        type="button"
        aria-pressed={filter === "all"}
        onClick={() => onChange("all")}
        className={chip(filter === "all")}
      >
        全部
      </button>
      {HELP_ROLES.map((role) => {
        const pressed = filter !== "all" && filter.includes(role);
        return (
          <button
            key={role}
            type="button"
            aria-pressed={pressed}
            data-help-role={role}
            onClick={() => onChange([role])}
            className={chip(pressed)}
          >
            {HELP_ROLE_LABEL[role]}
          </button>
        );
      })}
    </div>
  );
}

function GuideCard({
  guide,
  filter,
  usable,
}: {
  guide: AdminGuide;
  filter: Filter;
  usable: boolean;
}) {
  const isMobile = useIsMobile();
  const steps = stepsFor(guide, filter === "all" ? null : filter);
  const faq = adminFaqItems(guide.faq ?? []);
  return (
    <section
      id={guide.id}
      aria-labelledby={`${guide.id}-title`}
      data-admin-guide={guide.id}
      className="scroll-mt-4 rounded-card border border-line bg-surface p-4 shadow-card lg:p-5"
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <h2
          id={`${guide.id}-title`}
          className="min-w-0 flex-1 font-bold text-base text-ink-900 leading-7 lg:text-lg"
        >
          {guide.title}
        </h2>
        {guide.href && usable && (
          <Link
            href={guide.href}
            className="flex h-8 shrink-0 items-center gap-1 font-semibold text-brand-700 text-sm hover:underline"
          >
            前往
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>
      <p className="mt-0.5 text-ink-500 text-sm leading-6">{guide.summary}</p>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-ink-500">可以使用：</span>
        {guide.roles.map((role) => (
          <Badge key={role} tone="mute">
            {HELP_ROLE_LABEL[role]}
          </Badge>
        ))}
        {!usable && (
          <span className="font-semibold text-warm-600">
            你的身分不能使用這項功能
          </span>
        )}
      </p>
      <div className="mt-4">
        <GuideSteps
          steps={steps}
          compact={isMobile}
          labelFor={(step) => stepLabel(step.roles)}
        />
      </div>
      {guide.notes?.map((note) => (
        <p key={note} className="mt-3 text-ink-500 text-sm">
          <HelpText text={note} />
        </p>
      ))}
      {faq.length > 0 && (
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-line border-t pt-3 text-sm">
          <span className="text-ink-500">相關問題：</span>
          {faq.map((item) => (
            <a
              key={item.id}
              href={`#faq-${item.id}`}
              className="text-brand-700 underline decoration-brand-700/30 underline-offset-[0.2em] hover:text-brand-800"
            >
              {item.q}
            </a>
          ))}
        </p>
      )}
    </section>
  );
}

export function AdminHelpPage() {
  const { roles } = useAdmin();
  const [filter, setFilter] = useState<Filter>(() => defaultFilter(roles));
  const isMobile = useIsMobile();

  const guides = useMemo(
    () => ADMIN_GUIDES.filter((guide) => matches(guide, filter)),
    [filter],
  );
  const faq = useMemo<AdminFaqItem[]>(
    () => ADMIN_FAQ.filter((item) => matches(item, filter)),
    [filter],
  );
  const groups = useMemo(() => {
    const list: { name: string; items: AdminGuide[] }[] = [];
    for (const guide of guides) {
      const last = list[list.length - 1];
      if (last && last.name === guide.group) {
        last.items.push(guide);
      } else {
        list.push({ name: guide.group, items: [guide] });
      }
    }
    return list;
  }, [guides]);

  // A link to a guide hidden by the filter shows everything instead.
  useEffect(() => {
    const show = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) {
        return;
      }
      const id = hash.replace(/^faq-/, "");
      const hidden =
        ADMIN_GUIDES.some((guide) => guide.id === hash) &&
        !guides.some((guide) => guide.id === hash);
      const hiddenFaq =
        hash.startsWith("faq-") &&
        ADMIN_FAQ.some((item) => item.id === id) &&
        !faq.some((item) => item.id === id);
      if (hidden || hiddenFaq) {
        setFilter("all");
        return;
      }
      window.requestAnimationFrame(() =>
        document.getElementById(hash)?.scrollIntoView({ block: "start" }),
      );
    };
    show();
    window.addEventListener("hashchange", show);
    return () => window.removeEventListener("hashchange", show);
  }, [guides, faq]);

  const toc = (
    <nav aria-label="說明目錄" className="flex flex-col gap-3 text-sm">
      {groups.map((group) => (
        <div key={group.name}>
          <p className="mb-1 px-2 font-semibold text-[11px] text-ink-400">
            {group.name}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((guide) => (
              <li key={guide.id}>
                <a
                  href={`#${guide.id}`}
                  className="block truncate rounded-control px-2 py-1 text-ink-700 hover:bg-field"
                >
                  {guide.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <a
        href="#faq"
        className="block rounded-control px-2 py-1 font-semibold text-ink-700 hover:bg-field"
      >
        常見問題
      </a>
    </nav>
  );

  return (
    <>
      <PageHeader
        title="說明與教學"
        description={`每個管理功能的操作步驟與常見問題。你的身分：${roleList(roles)}。`}
      />
      <div className="mb-4">
        <RoleChips filter={filter} onChange={setFilter} />
        <p aria-live="polite" className="mt-2 text-ink-500 text-xs">
          {filter === "all"
            ? `全部 ${guides.length} 項功能`
            : `${roleList(filter)}可以使用的 ${guides.length} 項功能`}
        </p>
      </div>
      <div
        className={
          isMobile
            ? "flex flex-col gap-4"
            : "grid grid-cols-[13rem_minmax(0,1fr)] items-start gap-6 xl:grid-cols-[15rem_minmax(0,1fr)]"
        }
      >
        {!isMobile && (
          <aside className="custom-scrollbar sticky top-0 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-card border border-line bg-surface p-3 shadow-card">
            {toc}
          </aside>
        )}
        <div className="flex min-w-0 max-w-[56rem] flex-col gap-4">
          {groups.map((group) => (
            <div key={group.name} className="flex flex-col gap-3">
              <p className="px-1 font-semibold text-ink-500 text-xs">
                {group.name}
              </p>
              {group.items.map((guide) => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  filter={filter}
                  usable={guideFor(guide, roles)}
                />
              ))}
            </div>
          ))}
          <section
            id="faq"
            aria-labelledby="faq-title"
            className="scroll-mt-4 rounded-card border border-line bg-surface p-4 shadow-card lg:p-5"
          >
            <h2
              id="faq-title"
              className="mb-3 font-bold text-base text-ink-900 lg:text-lg"
            >
              常見問題
            </h2>
            {faq.length > 0 ? (
              <FaqAccordion
                items={faq}
                anchorPrefix="faq-"
                extra={(item) => {
                  const roles = (item as AdminFaqItem).roles;
                  return (
                    <p className="mt-2 text-ink-500 text-xs">
                      適用：{roleList(roles)}
                    </p>
                  );
                }}
              />
            ) : (
              <p className="text-ink-500 text-sm">這個身分沒有常見問題。</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

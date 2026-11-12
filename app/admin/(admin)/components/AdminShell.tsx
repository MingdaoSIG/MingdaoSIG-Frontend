"use client";

import { ArrowLeft, ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import NotFoundPage from "@/app/not-found";
import { ToastProvider } from "@/components/mobile/Toast";
import {
  type AdminRole,
  useAdminAccess,
  viewerRoles,
} from "@/utils/useAdminAccess";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
import { useOpenReportCount, usePendingCount } from "../api";
import {
  type AdminSection,
  type AdminSectionId,
  canSeeSection,
  sectionForPath,
  sectionsFor,
} from "../config";
import { AdminContext, type AdminContextValue } from "../context";
import { useOpenIssueCount } from "../issueReportsApi";
import { ConfirmProvider } from "./Modal";
import { ErrorState, Spinner } from "./ui";

// The admin panel's frame: works out the caller's role first (nothing is
// fetched before that), then shows the sidebar on desktop or the section
// switcher on phones, and the page. Admins see every section; content
// moderators 總覽, 貼文, 留言, 檢舉 and 使用者; SIG managers 總覽, SIG,
// 入社申請 and 廣播通知; anyone else gets the 404 page.

export function AdminShell({ children }: { children: ReactNode }) {
  const access = useAdminAccess();
  const { token } = useUserAccount();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const context = useMemo<AdminContextValue | null>(() => {
    if (
      access.status !== "admin" &&
      access.status !== "moderator" &&
      access.status !== "manager"
    ) {
      return null;
    }
    return {
      role: access.status,
      roles: viewerRoles(access.status, access.managedSigIds),
      isAdmin: access.status === "admin",
      isModerator: access.status === "admin" || access.status === "moderator",
      userId: access.userId,
      managedSigIds: access.managedSigIds,
      token,
    };
  }, [access, token]);

  if (access.status === "none") {
    return <NotFoundPage />;
  }

  if (!context) {
    return (
      <div className="layout-admin flex h-full items-center justify-center pt-16 lg:pt-0">
        {access.status === "error" ? (
          <ErrorState
            message={`無法確認你的管理權限：${access.message}`}
            onRetry={access.retry}
          />
        ) : (
          <Spinner label="確認權限中" />
        )}
      </div>
    );
  }

  const section = sectionForPath(pathname);
  const allowed = section ? canSeeSection(section, context.roles) : false;
  const content = allowed ? (
    <Suspense fallback={<Spinner />}>{children}</Suspense>
  ) : (
    <NotFoundPage />
  );

  return (
    <AdminContext.Provider value={context}>
      <ConfirmProvider>
        {isMobile ? (
          <div className="layout-admin custom-scrollbar h-full overflow-y-auto pt-[calc(4rem+env(safe-area-inset-top))]">
            <div className="sticky top-0 z-30 bg-canvas px-4 pt-3 pb-2">
              <SectionSwitcher roles={context.roles} current={section} />
            </div>
            <main
              id="admin-main"
              className="px-4 pt-2 pb-[calc(2rem+env(safe-area-inset-bottom))]"
            >
              {content}
            </main>
          </div>
        ) : (
          <div className="layout-admin flex h-full min-h-0">
            <Sidebar roles={context.roles} current={section} />
            <main
              id="admin-main"
              className="custom-scrollbar min-w-0 flex-1 overflow-y-auto"
            >
              <div className="mx-auto w-full max-w-[96rem] px-6 py-6 xl:px-8">
                {content}
              </div>
            </main>
            {/* Phones mount the toast host globally; desktop needs one. */}
            <ToastProvider />
          </div>
        )}
      </ConfirmProvider>
    </AdminContext.Provider>
  );
}

function groupSections(roles: AdminRole[]) {
  const groups: { name: string; items: AdminSection[] }[] = [];
  for (const section of sectionsFor(roles)) {
    const last = groups[groups.length - 1];
    if (last && last.name === section.group) {
      last.items.push(section);
    } else {
      groups.push({ name: section.group, items: [section] });
    }
  }
  return groups;
}

const ROLE_LABEL: Record<AdminRole, string> = {
  admin: "管理員",
  moderator: "內容管理員",
  manager: "SIG 幹部／指導老師",
};

type NavBadge = { count: number; tone: "warn" | "danger"; label: string };

const BADGE_TONE: Record<NavBadge["tone"], string> = {
  warn: "bg-warm-50 text-warm-600",
  danger: "bg-danger-50 text-danger-700",
};

/**
 * Counts waiting in the sidebar, each only for those who may read it:
 * join requests for admins and managers, open reports for admins and
 * content moderators, open 問題回報 for admins.
 */
function useNavCounts(roles: AdminRole[]) {
  const canDecide = roles.includes("admin") || roles.includes("manager");
  const canModerate = roles.includes("admin") || roles.includes("moderator");
  const isAdmin = roles.includes("admin");
  const pending = usePendingCount(canDecide);
  const reports = useOpenReportCount(canModerate);
  const issues = useOpenIssueCount(isAdmin);
  return {
    pending: canDecide ? (pending.data ?? 0) : 0,
    reports: canModerate ? (reports.data ?? 0) : 0,
    issues: isAdmin ? (issues.data ?? 0) : 0,
  };
}

type NavCounts = ReturnType<typeof useNavCounts>;

function navBadge(id: AdminSectionId, counts: NavCounts): NavBadge | undefined {
  if (id === "join-requests") {
    return { count: counts.pending, tone: "warn", label: "待審" };
  }
  if (id === "reports") {
    return { count: counts.reports, tone: "danger", label: "待處理" };
  }
  if (id === "issue-reports") {
    return { count: counts.issues, tone: "warn", label: "待處理" };
  }
  return undefined;
}

function badgeText(count: number) {
  return count > 99 ? "99+" : String(count);
}

function Sidebar({
  roles,
  current,
}: {
  roles: AdminRole[];
  current: AdminSection | null;
}) {
  const counts = useNavCounts(roles);
  const groups = groupSections(roles);

  return (
    <nav
      aria-label="管理平台"
      className="custom-scrollbar flex w-56 shrink-0 flex-col gap-0.5 overflow-y-auto border-line border-r bg-surface px-3 py-4"
    >
      {groups.map((group) => (
        <div key={group.name || "main"} className="flex flex-col gap-0.5">
          {group.name && (
            <p className="mx-2.5 mt-4 mb-1 font-semibold text-[11px] text-ink-400 tracking-wide">
              {group.name}
            </p>
          )}
          {group.items.map((section) => (
            <NavItem
              key={section.id}
              section={section}
              active={current?.id === section.id}
              badge={navBadge(section.id, counts)}
            />
          ))}
        </div>
      ))}
      <p className="mx-2.5 mt-auto pt-6 text-[11px] text-ink-400">
        身分：{roles.map((item) => ROLE_LABEL[item]).join("、")}
      </p>
    </nav>
  );
}

function NavItem({
  section,
  active,
  badge,
  onNavigate,
}: {
  section: AdminSection;
  active: boolean;
  badge?: NavBadge;
  onNavigate?: () => void;
}) {
  const Icon = section.icon;
  return (
    <Link
      href={section.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors ${
        active
          ? "bg-brand-50 font-semibold text-brand-800"
          : "text-ink-700 hover:bg-field"
      }`}
    >
      <Icon
        aria-hidden
        className={`size-4 shrink-0 ${active ? "text-brand-700" : "text-ink-400"}`}
      />
      <span className="min-w-0 flex-1 truncate">{section.label}</span>
      {badge && badge.count > 0 && (
        <span
          className={`rounded-chip px-1.5 font-semibold text-xs leading-5 ${BADGE_TONE[badge.tone]}`}
        >
          <span className="sr-only">{badge.label} </span>
          {badgeText(badge.count)}
        </span>
      )}
    </Link>
  );
}

/** Phones: the sidebar folds into one menu button above the page. */
function SectionSwitcher({
  roles,
  current,
}: {
  roles: AdminRole[];
  current: AdminSection | null;
}) {
  const [open, setOpen] = useState(false);
  const counts = useNavCounts(roles);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const groups = groupSections(roles);

  useEffect(() => {
    setOpen(false);
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
      if (!ref.current?.contains(event.target as Node)) {
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
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="admin-sections"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-control border border-line-strong bg-surface px-3 text-left font-semibold text-ink-800 shadow-card"
      >
        <Menu aria-hidden className="size-4 text-ink-500" />
        <span className="min-w-0 flex-1 truncate">
          <span className="sr-only">管理平台：</span>
          {current?.label ?? "管理平台"}
        </span>
        {counts.pending > 0 && current?.id !== "join-requests" && (
          <span className="rounded-chip bg-warm-50 px-1.5 font-semibold text-warm-600 text-xs leading-5">
            {badgeText(counts.pending)} 待審
          </span>
        )}
        {counts.reports > 0 && current?.id !== "reports" && (
          <span className="rounded-chip bg-danger-50 px-1.5 font-semibold text-danger-700 text-xs leading-5">
            {badgeText(counts.reports)} 檢舉
          </span>
        )}
        {counts.issues > 0 && current?.id !== "issue-reports" && (
          <span className="rounded-chip bg-warm-50 px-1.5 font-semibold text-warm-600 text-xs leading-5">
            {badgeText(counts.issues)} 回報
          </span>
        )}
        <ChevronDown
          aria-hidden
          className={`size-4 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <nav
          id="admin-sections"
          aria-label="管理平台"
          className="absolute inset-x-0 top-full z-40 mt-1.5 flex max-h-[70dvh] flex-col gap-0.5 overflow-y-auto rounded-card border border-line bg-surface p-2 shadow-card"
        >
          {groups.map((group) => (
            <div key={group.name || "main"} className="flex flex-col gap-0.5">
              {group.name && (
                <p className="mx-2.5 mt-2 mb-0.5 font-semibold text-[11px] text-ink-400">
                  {group.name}
                </p>
              )}
              {group.items.map((section) => (
                <NavItem
                  key={section.id}
                  section={section}
                  active={current?.id === section.id}
                  badge={navBadge(section.id, counts)}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          ))}
          <div className="mt-1 border-line border-t pt-1.5">
            <Link
              href="/"
              className="flex h-9 items-center gap-2.5 rounded-control px-2.5 text-ink-700 text-sm hover:bg-field"
            >
              <ArrowLeft aria-hidden className="size-4 text-ink-400" />
              回到網站
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}

/** Title row of an admin page. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-bold text-ink-900 text-lg lg:text-xl">{title}</h1>
        {description && (
          <p className="mt-0.5 text-ink-500 text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

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
import { type AdminRole, useAdminAccess } from "@/utils/useAdminAccess";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
import { usePendingCount } from "../api";
import { type AdminSection, sectionForPath, sectionsFor } from "../config";
import { AdminContext, type AdminContextValue } from "../context";
import { ConfirmProvider } from "./Modal";
import { ErrorState, Spinner } from "./ui";

// The admin panel's frame: works out the caller's role first (nothing is
// fetched before that), then shows the sidebar on desktop or the section
// switcher on phones, and the page. Admins see every section; SIG managers
// see 總覽, SIG and 入社申請; anyone else gets the 404 page.

export function AdminShell({ children }: { children: ReactNode }) {
  const access = useAdminAccess();
  const { token } = useUserAccount();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const context = useMemo<AdminContextValue | null>(() => {
    if (access.status !== "admin" && access.status !== "manager") {
      return null;
    }
    return {
      role: access.status,
      isAdmin: access.status === "admin",
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
  const allowed = section?.roles.includes(context.role) ?? false;
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
              <SectionSwitcher role={context.role} current={section} />
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
            <Sidebar role={context.role} current={section} />
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

function groupSections(role: AdminRole) {
  const groups: { name: string; items: AdminSection[] }[] = [];
  for (const section of sectionsFor(role)) {
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
  manager: "SIG 幹部／指導老師",
};

function Sidebar({
  role,
  current,
}: {
  role: AdminRole;
  current: AdminSection | null;
}) {
  const pending = usePendingCount();
  const groups = groupSections(role);

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
              badge={section.id === "join-requests" ? pending.data : undefined}
            />
          ))}
        </div>
      ))}
      <p className="mx-2.5 mt-auto pt-6 text-[11px] text-ink-400">
        身分：{ROLE_LABEL[role]}
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
  badge?: number;
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
      {typeof badge === "number" && badge > 0 && (
        <span className="rounded-chip bg-warm-50 px-1.5 font-semibold text-warm-600 text-xs leading-5">
          <span className="sr-only">待審 </span>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

/** Phones: the sidebar folds into one menu button above the page. */
function SectionSwitcher({
  role,
  current,
}: {
  role: AdminRole;
  current: AdminSection | null;
}) {
  const [open, setOpen] = useState(false);
  const pending = usePendingCount();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const groups = groupSections(role);

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

  const total = pending.data ?? 0;

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
        {total > 0 && current?.id !== "join-requests" && (
          <span className="rounded-chip bg-warm-50 px-1.5 font-semibold text-warm-600 text-xs leading-5">
            {total > 99 ? "99+" : total} 待審
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
                  badge={section.id === "join-requests" ? total : undefined}
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

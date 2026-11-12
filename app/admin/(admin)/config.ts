import {
  Award,
  Download,
  FileText,
  Flag,
  GraduationCap,
  History,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Shapes,
  Users,
} from "lucide-react";
import type { AdminRole } from "@/utils/useAdminAccess";

// The admin panel's sections, in sidebar order. Managers (SIG leaders and
// 指導老師) see only the sections listed for "manager", scoped to their
// SIGs by the backend.

export type AdminSectionId =
  | "overview"
  | "posts"
  | "comments"
  | "reports"
  | "sigs"
  | "join-requests"
  | "users"
  | "rollover"
  | "badges"
  | "exports"
  | "audit";

export type AdminSection = {
  id: AdminSectionId;
  label: string;
  href: string;
  group: "" | "內容" | "社群" | "其他";
  icon: LucideIcon;
  roles: AdminRole[];
};

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: "overview",
    label: "總覽",
    href: "/admin",
    group: "",
    icon: LayoutDashboard,
    roles: ["admin", "manager"],
  },
  {
    id: "posts",
    label: "貼文",
    href: "/admin/posts",
    group: "內容",
    icon: FileText,
    roles: ["admin"],
  },
  {
    id: "comments",
    label: "留言",
    href: "/admin/comments",
    group: "內容",
    icon: MessageSquare,
    roles: ["admin"],
  },
  {
    id: "reports",
    label: "檢舉",
    href: "/admin/reports",
    group: "內容",
    icon: Flag,
    roles: ["admin"],
  },
  {
    id: "sigs",
    label: "SIG",
    href: "/admin/sigs",
    group: "社群",
    icon: Shapes,
    roles: ["admin", "manager"],
  },
  {
    id: "join-requests",
    label: "入社申請",
    href: "/admin/join-requests",
    group: "社群",
    icon: Inbox,
    roles: ["admin", "manager"],
  },
  {
    id: "users",
    label: "使用者",
    href: "/admin/users",
    group: "社群",
    icon: Users,
    roles: ["admin"],
  },
  {
    id: "rollover",
    label: "學年交接",
    href: "/admin/rollover",
    group: "社群",
    icon: GraduationCap,
    roles: ["admin"],
  },
  {
    id: "badges",
    label: "徽章",
    href: "/admin/badges",
    group: "社群",
    icon: Award,
    roles: ["admin"],
  },
  {
    id: "exports",
    label: "匯出與報表",
    href: "/admin/exports",
    group: "其他",
    icon: Download,
    roles: ["admin"],
  },
  {
    id: "audit",
    label: "操作紀錄",
    href: "/admin/audit",
    group: "其他",
    icon: History,
    roles: ["admin"],
  },
];

export function sectionsFor(role: AdminRole) {
  return ADMIN_SECTIONS.filter((section) => section.roles.includes(role));
}

/** The section a path belongs to, or null for an unknown /admin path. */
export function sectionForPath(pathname: string) {
  if (pathname === "/admin" || pathname === "/admin/") {
    return ADMIN_SECTIONS[0];
  }
  return (
    ADMIN_SECTIONS.find(
      (section) =>
        section.id !== "overview" &&
        (pathname === section.href || pathname.startsWith(`${section.href}/`)),
    ) ?? null
  );
}

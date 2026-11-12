import {
  Award,
  Download,
  FileText,
  Flag,
  GraduationCap,
  History,
  Inbox,
  LayoutDashboard,
  ListFilter,
  LogIn,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  PanelTop,
  Shapes,
  Users,
} from "lucide-react";
import type { AdminRole } from "@/utils/useAdminAccess";

// The admin panel's sections, in sidebar order. Content moderators
// (permission 3) see the "moderator" sections; managers (SIG leaders and
// 指導老師) the "manager" ones, scoped to their SIGs by the backend. A
// content moderator who also manages a SIG sees both.

export type AdminSectionId =
  | "overview"
  | "posts"
  | "comments"
  | "reports"
  | "keyword-filter"
  | "sigs"
  | "join-requests"
  | "users"
  | "rollover"
  | "badges"
  | "banners"
  | "broadcast"
  | "exports"
  | "audit"
  | "logins";

export type AdminSection = {
  id: AdminSectionId;
  label: string;
  href: string;
  group: "" | "內容" | "社群" | "溝通" | "其他";
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
    roles: ["admin", "moderator", "manager"],
  },
  {
    id: "posts",
    label: "貼文",
    href: "/admin/posts",
    group: "內容",
    icon: FileText,
    roles: ["admin", "moderator"],
  },
  {
    id: "comments",
    label: "留言",
    href: "/admin/comments",
    group: "內容",
    icon: MessageSquare,
    roles: ["admin", "moderator"],
  },
  {
    id: "reports",
    label: "檢舉",
    href: "/admin/reports",
    group: "內容",
    icon: Flag,
    roles: ["admin", "moderator"],
  },
  {
    id: "keyword-filter",
    label: "關鍵字過濾",
    href: "/admin/keyword-filter",
    group: "內容",
    icon: ListFilter,
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
    // Content moderators: read and mute only (contract v4 §5.2).
    roles: ["admin", "moderator"],
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
    id: "banners",
    label: "公告橫幅",
    href: "/admin/banners",
    group: "溝通",
    icon: PanelTop,
    roles: ["admin"],
  },
  {
    id: "broadcast",
    label: "廣播通知",
    href: "/admin/broadcast",
    group: "溝通",
    icon: Megaphone,
    // Managers send to the SIGs they manage (contract v4 §5.5).
    roles: ["admin", "manager"],
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
  {
    id: "logins",
    label: "登入紀錄",
    href: "/admin/logins",
    group: "其他",
    icon: LogIn,
    roles: ["admin"],
  },
];

/** Whether any of the caller's roles may open the section. */
export function canSeeSection(section: AdminSection, roles: AdminRole[]) {
  return section.roles.some((role) => roles.includes(role));
}

export function sectionsFor(roles: AdminRole[]) {
  return ADMIN_SECTIONS.filter((section) => canSeeSection(section, roles));
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

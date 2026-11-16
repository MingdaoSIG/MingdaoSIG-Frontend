import type { AdminRole } from "@/utils/useAdminAccess";

// The role filter of 說明與教學 (decision 4C).
export const HELP_ROLE_LABEL: Record<AdminRole, string> = {
  admin: "管理員",
  moderator: "內容管理員",
  manager: "SIG 幹部與老師",
};

export const HELP_ROLES: AdminRole[] = ["admin", "moderator", "manager"];

export function roleList(roles: AdminRole[]) {
  return roles.map((role) => HELP_ROLE_LABEL[role]).join("、");
}

/** 「僅管理員」 for a step that only some roles use. */
export function stepLabel(roles: AdminRole[] | undefined) {
  if (!roles || roles.length === HELP_ROLES.length) {
    return null;
  }
  const list = roleList(roles);
  return `僅${/^[A-Za-z]/.test(list) ? " " : ""}${list}`;
}

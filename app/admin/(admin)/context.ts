"use client";

import { createContext, useContext } from "react";
import type { AdminRole } from "@/utils/useAdminAccess";

export type AdminContextValue = {
  role: AdminRole;
  /** Every role whose sections the caller sees (see viewerRoles). */
  roles: AdminRole[];
  isAdmin: boolean;
  /**
   * May moderate content (contract v4 §5.2): admins and content
   * moderators. Content moderators may only mute, never ban, and change
   * no roles or badges.
   */
  isModerator: boolean;
  userId: string;
  /** SIGs the caller leads or advises; empty for admins. */
  managedSigIds: string[];
  token: string | null;
};

export const AdminContext = createContext<AdminContextValue | null>(null);

/** The caller's role, known before any admin page renders. */
export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) {
    throw new Error("useAdmin must be used inside <AdminShell>");
  }
  return value;
}

/** Whether the caller may manage this SIG (admins: every SIG). */
export function canManageSig(admin: AdminContextValue, sigId: string) {
  return admin.isAdmin || admin.managedSigIds.includes(sigId);
}

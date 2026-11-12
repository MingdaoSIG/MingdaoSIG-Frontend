import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "./(admin)/components/AdminShell";

export const metadata: Metadata = {
  title: "管理平台 | MDSIG",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

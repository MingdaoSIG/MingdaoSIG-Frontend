"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { isAdminPath } from "@/utils/useAdminAccess";
import { useUserAccount } from "@/utils/useUserAccount";

// First-login onboarding (v3 9B), shown once: when `GET /user/me` says
// `onboardedAt: null` (contract v4 §6.2). A profile without the field (an
// older backend, or the stored copy before /user/me answered) shows
// nothing. The steps load only when needed.

const Onboarding = dynamic(() => import("./Onboarding"), { ssr: false });

export function OnboardingGate() {
  const { isLogin, isLoading, userData } = useUserAccount();
  const pathname = usePathname();
  const [closed, setClosed] = useState(false);

  if (
    closed ||
    isLoading ||
    !isLogin ||
    userData?.onboardedAt !== null ||
    isAdminPath(pathname)
  ) {
    return null;
  }
  return <Onboarding onClose={() => setClosed(true)} />;
}

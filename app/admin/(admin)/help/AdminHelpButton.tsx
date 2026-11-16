"use client";

import { CircleHelp } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// 「？說明」 at the top right of every admin page (decision 4C). The
// drawer and the help content load only when it is opened. Focus goes
// back to the button when the drawer closes. Not shown on /admin/help.

const AdminHelpDrawer = dynamic(() => import("./AdminHelpDrawer"), {
  ssr: false,
});

export function AdminHelpButton() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      setOpen(false);
    }
  }, [pathname]);

  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus({ preventScroll: true });
  }, []);

  if (pathname === "/admin/help") {
    return null;
  }
  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-admin-help
        className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 text-sm transition-colors hover:bg-field"
      >
        <CircleHelp aria-hidden className="size-4 text-brand-700" />
        說明
      </button>
      {open && <AdminHelpDrawer onClose={close} />}
    </>
  );
}

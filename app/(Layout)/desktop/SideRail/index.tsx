"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type FocusEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useAppBadge } from "@/components/Notifications/NotificationBell";
import {
  NOTIFICATION_PANEL_ID,
  NotificationPanel,
} from "@/components/Notifications/NotificationPanel";
import { formatUnread } from "@/modules/notifications/describe";
import { useSigSeen } from "@/modules/sigSeen";
import { useAdminChrome } from "@/utils/useAdminAccess";
import { useMySigs } from "@/utils/useMySigs";
import { useUnreadCount } from "@/utils/useNotifications";
import { useUserAccount } from "@/utils/useUserAccount";
import { NAV_ITEMS, type NavItem, navSection } from "../../nav";
import { RailSigs } from "./RailSigs";

// The desktop side rail (decision 2 = v2 1B): 58px wide, under the header
// (first column of the shell grid, see `.wrap[data-rail]` in globals.css).
// Top: 首頁 / 探索 / 通知 / 我的. Below: the user's SIGs as colour squares
// (Discord-style, a dot when a SIG has posts newer than the last visit),
// or 「＋ 探索 SIG」 when there are none. ＋發文 at the bottom.

export const RAIL_WIDTH = 58;

type Tip = { label: string; top: number } | null;

function useTip() {
  const [tip, setTip] = useState<Tip>(null);
  const show = (label: string) => (event: MouseEvent | FocusEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    // Centred on the square, and never past the top or bottom edge.
    const centre = rect.top + rect.height / 2;
    setTip({
      label,
      top: Math.min(Math.max(centre, 16), window.innerHeight - 16),
    });
  };
  const hide = () => setTip(null);
  return { tip, show, hide };
}

function RailLink({
  item,
  active,
  badge = 0,
  linkRef,
  onClick,
  expanded,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  linkRef?: React.Ref<HTMLAnchorElement>;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** 通知 with its side panel open. */
  expanded?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      ref={linkRef}
      href={item.href}
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={expanded ? NOTIFICATION_PANEL_ID : undefined}
      aria-current={active ? "page" : undefined}
      aria-label={
        badge > 0
          ? `${item.label}，${formatUnread(badge)} 則未讀`
          : item.ariaLabel
      }
      data-rail-item={item.section}
      className={`relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-control transition-colors ${
        active || expanded
          ? "bg-brand-700/10 text-brand-700"
          : "text-ink-500 hover:bg-field hover:text-ink-800"
      }`}
    >
      <Icon size={20} aria-hidden strokeWidth={active ? 2.4 : 2} />
      <span className="font-medium text-[10.5px] leading-none">
        {item.label}
      </span>
      {badge > 0 && (
        <span
          aria-hidden
          data-unread-badge
          className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-surface bg-danger-700 px-0.5 font-bold text-[9.5px] text-white leading-none"
        >
          {formatUnread(badge)}
        </span>
      )}
    </Link>
  );
}

export default function SideRail() {
  const path = usePathname();
  const { isLogin, userData } = useUserAccount();
  const { hideDock } = useAdminChrome();
  const { unread } = useUnreadCount();
  // The installed app's icon shows the same count.
  useAppBadge(unread);
  const { sigs, isLoading } = useMySigs();
  const { seen, baseline } = useSigSeen(userData?._id ?? "");
  const { tip, show, hide } = useTip();
  const section = navSection(path, userData?.customId);
  const [panelOpen, setPanelOpen] = useState(false);
  const notificationsRef = useRef<HTMLAnchorElement>(null);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  let decodedPath = path;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    // keep the raw path
  }

  // A SIG the rail meets for the first time starts as seen.
  const sigIds = sigs.map((sig) => sig._id).join(",");
  useEffect(() => {
    if (sigIds) {
      baseline(sigIds.split(","));
    }
  }, [sigIds, baseline]);

  // A tooltip must not stay behind when the page changes under it.
  useEffect(() => {
    hide();
  }, [path]);

  // The admin panel has its own navigation.
  if (hideDock) {
    return null;
  }

  return (
    <nav
      data-shell="rail"
      aria-label="主要導覽"
      className="glass-bar relative z-30 flex min-h-0 w-[58px] select-none flex-col items-center border-line border-r pt-3 pb-4"
    >
      <ul className="flex flex-col items-center gap-1">
        {(["home", "explore", "notifications", "me"] as const).map((key) => (
          <li key={key}>
            {key === "notifications" ? (
              <RailLink
                item={NAV_ITEMS[key]}
                active={section === key}
                badge={unread}
                linkRef={notificationsRef}
                expanded={section !== key ? panelOpen : undefined}
                onClick={(event) => {
                  // The page itself needs no panel on top of it.
                  if (section === key) {
                    return;
                  }
                  event.preventDefault();
                  setPanelOpen((value) => !value);
                }}
              />
            ) : (
              <RailLink
                item={NAV_ITEMS[key]}
                active={section === key && !panelOpen}
              />
            )}
          </li>
        ))}
      </ul>

      {isLogin && (
        <>
          <div aria-hidden className="my-3 h-px w-8 shrink-0 bg-line" />
          <div
            data-rail-sigs
            className="scrollbar-hide flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto py-1.5"
          >
            {isLoading ? (
              <div aria-hidden className="flex flex-col items-center gap-2.5">
                <span className="size-10 animate-pulse rounded-control bg-field" />
                <span className="size-10 animate-pulse rounded-control bg-field" />
              </div>
            ) : sigs.length > 0 ? (
              <RailSigs
                sigs={sigs}
                seen={seen}
                currentPath={decodedPath}
                onShow={show}
                onHide={hide}
              />
            ) : (
              <Link
                href="/explore"
                data-rail-explore-sigs
                className="flex w-12 flex-col items-center gap-1 rounded-control py-1.5 text-ink-500 transition-colors hover:bg-field hover:text-ink-800"
              >
                <span className="flex size-9 items-center justify-center rounded-control border-[1.5px] border-line-strong border-dashed">
                  <Plus size={16} aria-hidden />
                </span>
                <span className="text-center font-medium text-[10px] leading-tight">
                  探索 SIG
                </span>
              </Link>
            )}
          </div>
        </>
      )}

      <Link
        href="/new"
        aria-label="發文"
        aria-current={section === "new" ? "page" : undefined}
        onMouseEnter={show("發文")}
        onMouseLeave={hide}
        onFocus={show("發文")}
        onBlur={hide}
        className="mt-auto flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-700 text-white shadow-[0_6px_16px_-10px_rgba(11,90,131,0.9)] transition-colors hover:bg-brand-800"
      >
        <Plus size={22} aria-hidden strokeWidth={2.4} />
      </Link>

      <NotificationPanel
        open={panelOpen}
        onClose={closePanel}
        trigger={notificationsRef}
      />

      {/* In <body>: the rail's backdrop-filter would make it the
          containing block of a fixed tooltip and shift it down. */}
      {tip &&
        createPortal(
          <span
            role="tooltip"
            data-rail-tooltip
            className="pointer-events-none fixed z-50 max-w-60 -translate-y-1/2 truncate rounded-chip bg-ink-900 px-2 py-1 font-medium text-white text-xs shadow-card"
            style={{ left: RAIL_WIDTH + 6, top: tip.top }}
          >
            {tip.label}
          </span>,
          document.body,
        )}
    </nav>
  );
}

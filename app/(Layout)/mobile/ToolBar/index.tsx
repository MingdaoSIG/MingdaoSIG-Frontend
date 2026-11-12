"use client";

import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { TapScaleLink } from "@/components/mobile/TapScale";
import { useAppBadge } from "@/components/Notifications/NotificationBell";
import { formatUnread } from "@/modules/notifications/describe";
import { useAdminChrome } from "@/utils/useAdminAccess";
import { useUnreadCount } from "@/utils/useNotifications";
import { useUserAccount } from "@/utils/useUserAccount";
import { NAV_ITEMS, type NavSection, navSection } from "../../nav";
import styles from "./ToolBar.module.scss";

// The phone tab bar (decision 1B): 首頁 / 探索 / ＋發文 / 通知 / 我的.
// 通知 carries the unread count; tapping the tab you are on scrolls the
// page back to the top (`mobile:scroll-to-top`).

const TABS: NavSection[] = ["home", "explore", "new", "notifications", "me"];

const ToolBar = () => {
  const { userData } = useUserAccount();
  const path = usePathname();
  const { hideDock } = useAdminChrome();
  const { unread } = useUnreadCount();
  // The installed app's icon shows the same count.
  useAppBadge(unread);
  const selected = navSection(path, userData?.customId);

  // The admin panel has its own section switcher and 「回到網站」.
  if (hideDock) {
    return null;
  }

  return (
    <nav className={styles.toolBarWrapper} aria-label="主要導覽">
      <ul className={styles.tabList}>
        {TABS.map((section) => {
          const isActive = selected === section;
          const onClick = () => {
            if (isActive) {
              window.dispatchEvent(new CustomEvent("mobile:scroll-to-top"));
            }
          };
          if (section === "new") {
            return (
              <li key={section} className={styles.tabItem}>
                <TapScaleLink
                  href="/new"
                  aria-label="發文"
                  aria-current={isActive ? "page" : undefined}
                  data-tab="new"
                  className={styles.tab}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  onClick={onClick}
                >
                  <span className={styles.postButton}>
                    <Plus size={22} aria-hidden strokeWidth={2.4} />
                  </span>
                </TapScaleLink>
              </li>
            );
          }
          const item = NAV_ITEMS[section];
          const Icon = item.icon;
          const badge = section === "notifications" ? unread : 0;
          return (
            <li key={section} className={styles.tabItem}>
              <TapScaleLink
                href={item.href}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={
                  badge > 0
                    ? `${item.label}，${formatUnread(badge)} 則未讀`
                    : item.ariaLabel
                }
                data-tab={section}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={onClick}
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-indicator"
                    className={styles.activeIndicator}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <span className={styles.iconWrap}>
                  <Icon
                    size={22}
                    aria-hidden
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                  {badge > 0 && (
                    <span
                      aria-hidden
                      data-unread-badge
                      className={styles.badge}
                    >
                      {formatUnread(badge)}
                    </span>
                  )}
                </span>
                <span className={styles.label}>{item.label}</span>
              </TapScaleLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ToolBar;

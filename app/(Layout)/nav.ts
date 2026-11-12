import {
  Bell,
  Bookmark,
  ChartNoAxesColumn,
  Compass,
  GraduationCap,
  Heart,
  House,
  Info,
  Library,
  type LucideIcon,
  Settings,
  UserRound,
  Users,
} from "lucide-react";

// Navigation of the 2026 user-side redesign (decisions 1B and 2): the
// phone tab bar 首頁 / 探索 / ＋發文 / 通知 / 我的 and the desktop side
// rail with the same entries, plus the 我的 hub (decision 7B), which is
// the 我的 page on phones and the avatar menu on desktop.

export type NavSection = "home" | "explore" | "new" | "notifications" | "me";

export type NavItem = {
  section: NavSection;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: Record<Exclude<NavSection, "new">, NavItem> = {
  home: { section: "home", label: "首頁", href: "/", icon: House },
  explore: {
    section: "explore",
    label: "探索",
    href: "/explore",
    icon: Compass,
  },
  notifications: {
    section: "notifications",
    label: "通知",
    href: "/notifications",
    icon: Bell,
  },
  me: { section: "me", label: "我的", href: "/me", icon: UserRound },
};

const EXPLORE_PATHS = ["/explore", "/search", "/tag", "/data", "/events"];
const ME_PATHS = ["/me", "/portfolio", "/info", "/changelog", "/dashboard"];

function under(path: string, base: string) {
  return path === base || path.startsWith(`${base}/`);
}

/**
 * Which tab / rail entry the path belongs to, or null (posts, SIG pages,
 * other people's profiles, admin).
 */
export function navSection(
  path: string,
  ownCustomId?: string | null,
): NavSection | null {
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    // keep the raw path
  }
  if (decoded === "/") {
    return "home";
  }
  if (decoded === "/new") {
    return "new";
  }
  if (under(decoded, "/notifications")) {
    return "notifications";
  }
  if (EXPLORE_PATHS.some((base) => under(decoded, base))) {
    return "explore";
  }
  if (ME_PATHS.some((base) => under(decoded, base))) {
    return "me";
  }
  if (ownCustomId && decoded === `/@${ownCustomId}`) {
    return "me";
  }
  return null;
}

export type HubItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type HubGroup = { key: string; items: HubItem[] };

/**
 * The 我的 hub entries. Profile tabs open with `?tab=` on your own
 * profile; without a customId yet they fall back to the hub.
 */
export function hubGroups(customId: string | null | undefined): HubGroup[] {
  const profile = customId ? `/@${customId}` : "/me";
  const tab = (name: string) => (customId ? `${profile}?tab=${name}` : "/me");
  return [
    {
      key: "content",
      items: [
        { key: "sigs", label: "我的 SIG", href: "/me#my-sigs", icon: Users },
        {
          key: "bookmarks",
          label: "收藏",
          href: tab("bookmarks"),
          icon: Bookmark,
        },
        { key: "liked", label: "按讚", href: tab("liked"), icon: Heart },
        { key: "series", label: "系列", href: tab("series"), icon: Library },
      ],
    },
    {
      key: "growth",
      items: [
        {
          key: "portfolio",
          label: "學習歷程",
          href: "/portfolio",
          icon: GraduationCap,
        },
        {
          key: "stats",
          label: "數據",
          href: tab("stats"),
          icon: ChartNoAxesColumn,
        },
      ],
    },
    {
      key: "settings",
      items: [
        {
          key: "notification-settings",
          label: "通知設定",
          href: "/notifications?settings=1",
          icon: Settings,
        },
        { key: "about", label: "平台資訊", href: "/info", icon: Info },
      ],
    },
  ];
}

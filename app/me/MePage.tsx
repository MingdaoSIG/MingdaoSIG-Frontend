"use client";

import {
  ChevronRight,
  LayoutDashboard,
  LogIn,
  LogOut,
  Plus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { confirmLogout } from "@/app/(Layout)/confirmLogout";
import { hubGroups } from "@/app/(Layout)/nav";
import { DocPage } from "@/components/desktop/DocPage";
import { PageTitle } from "@/components/mobile/PageTitle";
import { useDraftList } from "@/components/PostEditor/shared/DraftBar";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import { useAdminChrome } from "@/utils/useAdminAccess";
import useIsMobile from "@/utils/useIsMobile";
import { type MySig, useMySigs } from "@/utils/useMySigs";
import { useUpcomingEvents } from "@/utils/useSiteEvents";
import { useUserAccount } from "@/utils/useUserAccount";

// 我的 (decision 7B): the hub of everything personal. On phones it is the
// 我的 tab; on desktop the avatar menu lists the same entries
// (app/(Layout)/nav.ts `hubGroups`). Logged out it offers 登入 and keeps
// 平台資訊 reachable.

const ROLE_LABEL: Record<MySig["role"], string> = {
  managed: "管理中",
  member: "成員",
  followed: "追蹤中",
};

function Card({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section
      aria-label={label}
      className={`shrink-0 overflow-hidden rounded-card border border-line bg-surface shadow-card ${className}`}
    >
      {children}
    </section>
  );
}

const rowClass =
  "flex min-h-12 items-center gap-3 px-4 py-2.5 text-ink-800 transition-colors hover:bg-field focus-visible:bg-field";

function Row({
  href,
  icon,
  children,
  trailing,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <Link href={href} className={rowClass}>
      <span className="flex size-5 shrink-0 items-center justify-center text-ink-500">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium text-[0.95rem]">
        {children}
      </span>
      {trailing}
      <ChevronRight size={16} aria-hidden className="shrink-0 text-ink-400" />
    </Link>
  );
}

function MySigList() {
  const { sigs, isLoading, isError } = useMySigs();
  return (
    <Card label="我的 SIG">
      <h2
        id="my-sigs"
        className="scroll-mt-24 border-line border-b px-4 py-3 font-bold text-ink-900"
      >
        我的 SIG
        {sigs.length > 0 && (
          <span className="ml-2 font-medium text-ink-400 text-sm">
            {sigs.length}
          </span>
        )}
      </h2>
      {isLoading ? (
        <div aria-hidden className="flex flex-col gap-2 p-4">
          <div className="h-5 w-1/2 animate-pulse rounded-chip bg-field" />
          <div className="h-5 w-1/3 animate-pulse rounded-chip bg-field" />
        </div>
      ) : isError ? (
        <p role="alert" className="px-4 py-4 text-ink-500 text-sm">
          SIG 列表載入失敗，請稍後再試
        </p>
      ) : sigs.length === 0 ? (
        <div className="flex flex-col items-start gap-3 px-4 py-4">
          <p className="text-ink-500 text-sm">你還沒有加入或追蹤任何 SIG。</p>
          <Link
            href="/explore"
            className="flex h-10 items-center gap-1.5 rounded-control bg-brand-700 px-4 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
          >
            <Plus size={16} aria-hidden />
            探索 SIG
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {sigs.map((sig) => (
            <li key={sig._id}>
              <Link
                href={`/@${sig.customId}`}
                className={rowClass}
                style={{
                  ["--sig-color" as string]:
                    resolveSigColor(sig) ?? BRAND_COLOR,
                }}
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full bg-[var(--sig-color)]"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-[0.95rem]">
                  {sig.name}
                </span>
                <span className="shrink-0 text-ink-500 text-xs">
                  {ROLE_LABEL[sig.role]}
                </span>
                <ChevronRight
                  size={16}
                  aria-hidden
                  className="shrink-0 text-ink-400"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Count({ value }: { value: number | undefined }) {
  if (typeof value !== "number" || value <= 0) {
    return null;
  }
  return (
    <span className="shrink-0 rounded-full bg-field px-2 py-0.5 font-semibold text-ink-700 text-xs tabular-nums">
      {value}
    </span>
  );
}

/** The numbers beside 活動報名 and 草稿. */
function useHubCounts(userId: string) {
  const rsvped = useUpcomingEvents("rsvped", 1, Boolean(userId));
  const drafts = useDraftList(userId, Boolean(userId));
  return {
    events: rsvped.data?.total,
    drafts: drafts.data?.length,
  } as Record<string, number | undefined>;
}

function Content() {
  const { isLogin, isLoading, userData, login, logout } = useUserAccount();
  const { canOpenAdmin } = useAdminChrome();
  const customId = userData?.customId ?? null;
  const counts = useHubCounts(isLogin ? (userData?._id ?? "") : "");

  if (isLoading) {
    return (
      <Card>
        <div aria-hidden className="flex items-center gap-3 p-4">
          <div className="size-14 animate-pulse rounded-full bg-field" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-5 w-32 animate-pulse rounded-chip bg-field" />
            <div className="h-4 w-20 animate-pulse rounded-chip bg-field" />
          </div>
        </div>
      </Card>
    );
  }

  if (!isLogin) {
    return (
      <>
        <Card className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <p className="text-ink-700">
            登入後，這裡會有你的 SIG、收藏、草稿與學習歷程。
          </p>
          <button
            type="button"
            onClick={() => login()}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-control bg-brand-700 px-6 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
          >
            <LogIn size={16} aria-hidden />
            登入
          </button>
        </Card>
        <Card label="平台資訊">
          <div className="divide-y divide-line">
            {hubGroups(null)
              .flatMap((group) => group.items)
              .filter((item) => item.key === "about")
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Row
                    key={item.key}
                    href={item.href}
                    icon={<Icon size={18} />}
                    trailing={<Count value={counts[item.key]} />}
                  >
                    {item.label}
                  </Row>
                );
              })}
          </div>
        </Card>
      </>
    );
  }

  const avatar = imageUrl(userData?.avatar) ?? DEFAULT_AVATAR_URL;
  return (
    <>
      <Card>
        <Link
          href={customId ? `/@${customId}` : "/me"}
          className="flex items-center gap-3 p-4 transition-colors hover:bg-field"
        >
          <Image
            src={avatar}
            width={56}
            height={56}
            alt=""
            className="size-14 shrink-0 rounded-full object-cover"
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-bold text-ink-900 text-lg">
              {userData?.name}
            </span>
            {customId && (
              <span className="truncate text-ink-500 text-sm">@{customId}</span>
            )}
            <span className="mt-0.5 font-semibold text-brand-700 text-sm">
              查看我的個人頁面
            </span>
          </span>
          <ChevronRight size={18} aria-hidden className="text-ink-400" />
        </Link>
      </Card>
      <MySigList />
      {hubGroups(customId).map((group) => {
        const items = group.items.filter((item) => item.key !== "sigs");
        if (items.length === 0) {
          return null;
        }
        return (
          <Card key={group.key}>
            <div className="divide-y divide-line">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Row
                    key={item.key}
                    href={item.href}
                    icon={<Icon size={18} />}
                    trailing={<Count value={counts[item.key]} />}
                  >
                    {item.label}
                  </Row>
                );
              })}
            </div>
          </Card>
        );
      })}
      <Card>
        <div className="divide-y divide-line">
          {canOpenAdmin && (
            <Row href="/admin" icon={<LayoutDashboard size={18} />}>
              管理平台
            </Row>
          )}
          <button
            type="button"
            onClick={() => confirmLogout(logout)}
            className={`${rowClass} w-full cursor-pointer text-left text-danger-700`}
          >
            <LogOut size={18} aria-hidden className="shrink-0" />
            <span className="font-medium text-[0.95rem]">登出</span>
          </button>
        </div>
      </Card>
    </>
  );
}

export default function MePage() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <PageTitle title="我的" />
        <div
          data-me-hub
          className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4"
        >
          <Content />
        </div>
      </div>
    );
  }

  return (
    <DocPage title="我的" width="narrow">
      <div data-me-hub className="flex flex-col gap-4 pb-2">
        <Content />
      </div>
    </DocPage>
  );
}

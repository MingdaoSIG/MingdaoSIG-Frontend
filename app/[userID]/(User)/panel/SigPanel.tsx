"use client";

import {
  Bell,
  CalendarDays,
  LogOut,
  MoreHorizontal,
  Settings2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { JoinSigDialog } from "@/components/Sig/JoinSigDialog";
import { RecruitingStatus } from "@/components/Sig/RecruitingStatus";
import { SigEventCard } from "@/components/SigEvents/SigEventCard";
import {
  featuredPostsOf,
  SigShowcase,
} from "@/components/SigShowcase/SigShowcase";
import { announcementSigId } from "@/components/Threads/configs/announcement";
import type { Sig } from "@/interfaces/Sig";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";
import { formatEventTime } from "@/modules/sigEvents";
import { BRAND_COLOR } from "@/modules/sigTheme";
import { useSigColor } from "@/modules/sigTheme/useSigColor";
import { useSigEvents } from "@/utils/useSigEvents";
import useUser from "@/utils/useUser";
import { EditSigDialog } from "../components/EditSigDialog";
import { useJoinSig } from "../useJoinSig";
import { useLeaveSig } from "../useLeaveSig";
import { useSigManager } from "../useSigManager";
import { PanelBanner } from "./PanelBanner";
import type { SigTab } from "./SigTabs";

// The SIG page's info panel (owner decision 2026-11-12, v4 4A): the
// banner header, the SIG's name, @id, member and follower counts and its
// one-line description, then what fits the viewer:
// - not a member: the recruiting card (申請加入), 精選成果, upcoming
//   events, 幹部與老師;
// - a member: the next event with RSVP, and 退出 / 通知 in a menu;
// - a manager: 「管理這個 SIG」 as well.
// The SIG colour marks the panel (top line, join button), never a hero.

export function notice(icon: "success" | "error", title: string) {
  void Swal.fire({
    toast: true,
    position: "top",
    icon,
    title,
    showConfirmButton: false,
    timer: icon === "error" ? 4000 : 2500,
    timerProgressBar: true,
  });
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-col gap-2 rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <h2 className="flex items-center justify-between gap-2 font-bold text-ink-900 text-sm">
        {title}
        {action}
      </h2>
      {children}
    </section>
  );
}

/** A leader or advisor, with a link to their profile. */
function Person({ id, role }: { id: string; role: string }) {
  const { data: user } = useUser(id);
  const body = (
    <>
      <Image
        src={imageUrl(user?.avatar) ?? DEFAULT_AVATAR_URL}
        width={32}
        height={32}
        alt=""
        unoptimized
        className="size-8 shrink-0 rounded-full border border-line bg-field object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink-800 text-sm">
          {user?.name || (user?.customId ? `@${user.customId}` : "…")}
        </span>
        <span className="block text-ink-500 text-xs">{role}</span>
      </span>
    </>
  );
  return user?.customId ? (
    <Link
      href={`/@${user.customId}`}
      className="flex items-center gap-2.5 rounded-control px-1 py-1 hover:bg-field"
    >
      {body}
    </Link>
  ) : (
    <div className="flex items-center gap-2.5 px-1 py-1">{body}</div>
  );
}

export function SigPeople({ sig }: { sig: Sig }) {
  const leaders = sig.leader ?? [];
  const advisors = sig.moderator ?? [];
  if (leaders.length + advisors.length === 0) {
    return <p className="text-ink-500 text-sm">還沒有幹部或指導老師</p>;
  }
  return (
    <ul className="flex flex-col">
      {leaders.map((id) => (
        <li key={`l-${id}`}>
          <Person id={id} role="幹部" />
        </li>
      ))}
      {advisors.map((id) => (
        <li key={`m-${id}`}>
          <Person id={id} role="指導老師" />
        </li>
      ))}
    </ul>
  );
}

/** 「退出 SIG」 and 「通知設定」 behind a ⋯ button (members). */
function MemberMenu({ onLeave }: { onLeave: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const item =
    "flex h-10 w-full cursor-pointer items-center gap-2 rounded-control px-2.5 text-left text-sm hover:bg-field";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="成員選項"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-10 cursor-pointer items-center justify-center rounded-control border border-line-strong bg-surface text-ink-700 hover:bg-field"
      >
        <MoreHorizontal aria-hidden className="size-5" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-1 flex w-44 flex-col gap-0.5 rounded-card border border-line bg-surface p-1.5 shadow-card-hover">
          <Link
            href="/notifications?settings=1"
            className={`${item} text-ink-800`}
          >
            <Bell aria-hidden className="size-4 text-ink-500" />
            通知設定
          </Link>
          <button
            type="button"
            className={`${item} text-danger-700`}
            onClick={() => {
              setOpen(false);
              onLeave();
            }}
          >
            <LogOut aria-hidden className="size-4" />
            退出 SIG
          </button>
        </div>
      )}
    </div>
  );
}

function UpcomingEvents({
  sig,
  canManage,
  member,
  onShowAll,
}: {
  sig: Sig;
  canManage: boolean;
  member: boolean;
  onShowAll: () => void;
}) {
  const events = useSigEvents(sig._id, "upcoming", 3);
  const items = events.data?.pages.flatMap((page) => page.items) ?? [];
  if (events.isPending || items.length === 0) {
    return null;
  }
  const showAll = (
    <button
      type="button"
      onClick={onShowAll}
      className="cursor-pointer font-semibold text-brand-700 text-xs hover:underline"
    >
      全部活動
    </button>
  );
  // Members get the next event with RSVP; others a short list.
  if (member) {
    return (
      <Card title="下一個活動" action={showAll}>
        <SigEventCard
          event={items[0]}
          sig={{ _id: sig._id, name: sig.name, customId: sig.customId }}
          canManage={canManage}
          variant="mobile"
        />
      </Card>
    );
  }
  return (
    <Card title="即將舉行" action={showAll}>
      <ul className="flex flex-col gap-1.5">
        {items.map((event) => (
          <li key={event._id} className="flex items-start gap-2 text-sm">
            <CalendarDays
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-ink-400"
            />
            <span className="min-w-0 flex-1">
              <span className="block break-words font-semibold text-ink-800">
                {event.title}
              </span>
              <span className="block text-ink-500 text-xs">
                {formatEventTime(event)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function SigPanel({
  sig,
  setSig,
  onTab,
  follow,
  compact = false,
}: {
  sig: Sig;
  setSig: (sig: Sig) => void;
  /** Opens a tab of the left column (「全部活動」 → 活動). */
  onTab: (tab: SigTab) => void;
  /** 追蹤 / 已追蹤 (FE-U1's useFollowSig), when available. */
  follow?: ReactNode;
  /** Phones: the identity card only (the rest is in the tabs). */
  compact?: boolean;
}) {
  const colorOf = useSigColor();
  const color = colorOf(sig, BRAND_COLOR) ?? BRAND_COLOR;
  const isAnnouncement = sig._id === announcementSigId;
  const joinSig = useJoinSig(sig, true);
  const manager = useSigManager(sig, true);
  const [editing, setEditing] = useState(false);
  const { leave } = useLeaveSig({
    sig,
    isLeader: manager.isLeader,
    isModerator: manager.isModerator,
    onLeft: joinSig.markLeft,
    notify: notice,
  });
  const member = joinSig.isMember || manager.canManage;
  const featured = featuredPostsOf(sig);
  const counts = [
    typeof sig.memberCount === "number" ? `${sig.memberCount} 位成員` : "",
    typeof sig.followerCount === "number" ? `${sig.followerCount} 人追蹤` : "",
  ].filter(Boolean);

  const joinButton = (
    <button
      type="button"
      className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-control px-4 font-semibold text-sm text-white transition-[filter] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: `color-mix(in srgb, ${color} 85%, #111d29)`,
      }}
      onClick={joinSig.join}
      disabled={joinSig.disabled}
    >
      {joinSig.label}
    </button>
  );

  const identity = (
    <section
      aria-label="SIG 資訊"
      className="overflow-hidden rounded-card border border-line bg-surface shadow-card"
      style={{ borderTop: `3px solid ${color}` }}
      data-sig-panel
    >
      <PanelBanner
        avatar={sig.avatar}
        badges={sig.badge}
        onEditSig={manager.canManage ? () => setEditing(true) : undefined}
        strip={compact}
      />
      <div
        className={`flex flex-col gap-3 px-4 pb-4 ${compact ? "pt-7" : "pt-14"}`}
      >
        <div className="min-w-0">
          <h1 className="break-words font-bold text-ink-900 text-xl leading-snug [overflow-wrap:anywhere]">
            {sig.name}
          </h1>
          <p className="text-[13px] text-ink-500 [overflow-wrap:anywhere]">
            {sig.customId && (
              <span
                className="sig-text font-semibold"
                style={{ ["--sig-color" as string]: color }}
              >
                @{sig.customId}
              </span>
            )}
            {counts.length > 0 && <span> · {counts.join(" · ")}</span>}
          </p>
        </div>
        {sig.description && (
          <p className="line-clamp-2 whitespace-pre-line break-words text-ink-700 text-sm leading-6">
            {sig.description}
          </p>
        )}
        {!isAnnouncement && (
          <div className="flex flex-wrap items-center gap-2">
            {!member && joinButton}
            {follow}
            {joinSig.isMember && !manager.canManage && (
              <>
                <span className="flex-1 text-ink-500 text-sm">
                  你是這個 SIG 的成員
                </span>
                <MemberMenu onLeave={leave} />
              </>
            )}
            {manager.canManage && (
              <Link
                href={`/admin/sigs/${sig._id}`}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface px-4 font-semibold text-ink-800 text-sm hover:bg-field"
              >
                <Settings2 aria-hidden className="size-4" />
                管理這個 SIG
              </Link>
            )}
          </div>
        )}
        {!isAnnouncement && !member && joinSig.notice && (
          <p className="text-ink-500 text-xs">{joinSig.notice}</p>
        )}
      </div>
    </section>
  );

  return (
    <>
      <div className="flex min-w-0 flex-col gap-4">
        {identity}
        {!compact && !isAnnouncement && (
          <>
            {!member && (
              <RecruitingStatus
                variant="card"
                recruiting={
                  joinSig.recruiting
                    ? sig.recruiting
                    : { ...sig.recruiting, open: false }
                }
              />
            )}
            <UpcomingEvents
              sig={sig}
              canManage={manager.canManage}
              member={member}
              onShowAll={() => onTab("events")}
            />
            {!member && featured.length > 0 && (
              <div className="rounded-card border border-line bg-surface p-4 shadow-card">
                <SigShowcase posts={featured} variant="mobile" />
              </div>
            )}
            {!member && (
              <Card title="幹部與老師">
                <SigPeople sig={sig} />
              </Card>
            )}
          </>
        )}
      </div>
      {!isAnnouncement && <JoinSigDialog sig={sig} {...joinSig.dialog} />}
      {manager.canManage && (
        <EditSigDialog
          sig={sig}
          open={editing}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            setSig(saved);
            notice("success", "SIG 資料已更新");
          }}
        />
      )}
    </>
  );
}

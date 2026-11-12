"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { InfiniteThreadList } from "@/components/PostCard/InfiniteThreadList";
import { postListFetcher } from "@/components/PostCard/postListFetcher";
import { RecruitingStatus } from "@/components/Sig/RecruitingStatus";
import { SigEventList } from "@/components/SigEvents/SigEventList";
import {
  featuredPostsOf,
  SigShowcase,
} from "@/components/SigShowcase/SigShowcase";
import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import { apiRequest } from "@/modules/api/client";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";
import { useSigManager } from "../useSigManager";
import { SigPeople } from "./SigPanel";

// The SIG page's left column (v4 4A): 貼文 / 活動 / 成果 / 成員 / 關於
// above the content; 貼文 (the infinite list) is the default. `?tab=`
// opens a tab (`?tab=events` is the link in event notifications).

export type SigTab = "posts" | "events" | "showcase" | "members" | "about";

const TABS: { value: SigTab; label: string }[] = [
  { value: "posts", label: "貼文" },
  { value: "events", label: "活動" },
  { value: "showcase", label: "成果" },
  { value: "members", label: "成員" },
  { value: "about", label: "關於" },
];

export function isSigTab(value: unknown): value is SigTab {
  return TABS.some((tab) => tab.value === value);
}

export function SigTabBar({
  value,
  onChange,
  color,
  mobile = false,
}: {
  value: SigTab;
  onChange: (tab: SigTab) => void;
  /** The SIG colour, for the active tab's underline. */
  color: string;
  mobile?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="SIG 內容"
      className="scrollbar-hide flex shrink-0 select-none gap-1 overflow-x-auto border-line border-b"
      data-sig-tabs
    >
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`-mb-px shrink-0 cursor-pointer whitespace-nowrap border-b-[3px] px-3.5 font-semibold text-sm transition-colors ${
              mobile ? "h-11" : "h-10"
            } ${active ? "text-ink-900" : "border-transparent text-ink-500 hover:text-ink-800"}`}
            style={active ? { borderBottomColor: color } : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function SigPosts({ sig }: { sig: Sig }) {
  const fetchPage = useMemo(
    () => postListFetcher(`/post/list/sig/${sig._id}`),
    [sig._id],
  );
  return (
    <InfiniteThreadList
      fetchPage={fetchPage}
      queryKey={["sigPosts", sig._id]}
      hideSig
      label={`${sig.name} 的貼文`}
      empty={
        <p className="rounded-card border border-line border-dashed bg-surface/60 px-6 py-12 text-center text-ink-500 text-sm">
          這個 SIG 還沒有貼文
        </p>
      }
    />
  );
}

/** Managers see everyone (`GET /sig/:id/members`); others the count. */
function SigMembers({ sig }: { sig: Sig }) {
  const manager = useSigManager(sig, true);
  const members = useQuery<User[]>({
    queryKey: ["sigMembers", sig._id],
    queryFn: async ({ signal }) => {
      const result = await apiRequest<User[]>(`/sig/${sig._id}/members`, {
        auth: true,
        signal,
      });
      return result.ok && Array.isArray(result.data) ? result.data : [];
    },
    enabled: manager.canManage,
    staleTime: 60 * 1000,
  });
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 font-bold text-ink-900 text-sm">幹部與老師</h2>
        <SigPeople sig={sig} />
      </section>
      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 font-bold text-ink-900 text-sm">
          成員
          {typeof sig.memberCount === "number" && (
            <span className="ml-1.5 font-normal text-ink-500">
              {sig.memberCount} 位
            </span>
          )}
        </h2>
        {manager.canManage ? (
          members.isPending ? (
            <p className="text-ink-500 text-sm">載入中…</p>
          ) : (
            <ul className="grid gap-1 sm:grid-cols-2">
              {(members.data ?? []).map((user) => (
                <li key={user._id}>
                  <Link
                    href={user.customId ? `/@${user.customId}` : "#"}
                    className="flex items-center gap-2.5 rounded-control px-1 py-1 hover:bg-field"
                  >
                    <Image
                      src={imageUrl(user.avatar) ?? DEFAULT_AVATAR_URL}
                      width={28}
                      height={28}
                      alt=""
                      unoptimized
                      className="size-7 shrink-0 rounded-full border border-line object-cover"
                    />
                    <span className="min-w-0 truncate text-ink-800 text-sm">
                      {user.name || `@${user.customId}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="text-ink-500 text-sm">
            成員名單只有這個 SIG 的幹部與老師看得到。
          </p>
        )}
      </section>
    </div>
  );
}

function SigAbout({ sig }: { sig: Sig }) {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-card border border-line bg-surface p-5 shadow-card">
        <h2 className="mb-2 font-bold text-ink-900 text-sm">關於 {sig.name}</h2>
        <p className="whitespace-pre-line break-words text-ink-700 text-sm leading-7">
          {sig.description || "這個 SIG 還沒有介紹"}
        </p>
      </section>
      <RecruitingStatus variant="card" recruiting={sig.recruiting} />
      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 font-bold text-ink-900 text-sm">幹部與老師</h2>
        <SigPeople sig={sig} />
      </section>
    </div>
  );
}

export function SigContent({
  sig,
  tab,
  mobile = false,
}: {
  sig: Sig;
  tab: SigTab;
  mobile?: boolean;
}) {
  const manager = useSigManager(sig, true);
  const variant = mobile ? "mobile" : "desktop";
  switch (tab) {
    case "events":
      return (
        <SigEventList
          sig={{ _id: sig._id, name: sig.name, customId: sig.customId }}
          canManage={manager.canManage}
          variant={variant}
        />
      );
    case "showcase": {
      const featured = featuredPostsOf(sig);
      return featured.length > 0 ? (
        <SigShowcase posts={featured} variant={variant} />
      ) : (
        <p className="rounded-card border border-line border-dashed bg-surface/60 px-6 py-12 text-center text-ink-500 text-sm">
          這個 SIG 還沒有精選成果
        </p>
      );
    }
    case "members":
      return <SigMembers sig={sig} />;
    case "about":
      return <SigAbout sig={sig} />;
    default:
      return <SigPosts sig={sig} />;
  }
}

"use client";

import { CalendarDays, Hash, Heart } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { EventMini, EventMiniSkeleton } from "@/components/Events/EventMini";
import { TopTags } from "@/components/Tags/TopTags";
import { useMySigs } from "@/utils/useMySigs";
import { useTopPost } from "@/utils/usePost";
import { useUpcomingEvents } from "@/utils/useSiteEvents";

// The home right column on desktop (decision 3A): 近期活動, 熱門標籤 and
// 熱門貼文. The SIG tiles that used to be here live in 探索 now.

function RailCard({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="glass shrink-0 rounded-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center justify-center rounded-chip bg-brand-50 p-1.5 text-brand-700">
          {icon}
        </span>
        <h2 className="flex-1 font-bold text-base text-ink-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function UpcomingEvents() {
  const { sigs } = useMySigs();
  // Your SIGs' events when you have SIGs, every SIG's otherwise.
  const scope = sigs.length > 0 ? "mine" : "all";
  const events = useUpcomingEvents(scope, 4);
  const items = events.data?.items ?? [];
  return (
    <RailCard
      icon={<CalendarDays size={16} aria-hidden />}
      title="近期活動"
      action={
        <Link
          href={scope === "mine" ? "/events?scope=mine" : "/events"}
          className="shrink-0 font-semibold text-brand-700 text-sm hover:underline"
        >
          查看全部
        </Link>
      }
    >
      {events.isPending ? (
        <EventMiniSkeleton rows={2} />
      ) : events.isError ? (
        <p className="text-ink-500 text-sm">近期活動載入失敗</p>
      ) : items.length === 0 ? (
        <p className="text-ink-500 text-sm">接下來 60 天沒有活動</p>
      ) : (
        <ul className="-mx-1.5 flex flex-col gap-0.5">
          {items.map((item) => (
            <li key={item.event._id}>
              <EventMini item={item} />
            </li>
          ))}
        </ul>
      )}
    </RailCard>
  );
}

function HotPosts() {
  const { data, isPending, isError } = useTopPost({ pageSize: 3 });
  const posts = (data?.pages?.[0] ?? []).filter(
    (post) => typeof post?._id === "string",
  );
  return (
    <RailCard icon={<Heart size={16} aria-hidden />} title="熱門貼文">
      {isPending ? (
        <div aria-hidden className="flex flex-col gap-2">
          <div className="h-5 animate-pulse rounded-chip bg-field" />
          <div className="h-5 animate-pulse rounded-chip bg-field" />
        </div>
      ) : isError ? (
        <p className="text-ink-500 text-sm">熱門貼文載入失敗</p>
      ) : posts.length === 0 ? (
        <p className="text-ink-500 text-sm">還沒有貼文</p>
      ) : (
        <ol className="-mx-2 flex flex-col gap-0.5">
          {posts.map((post, index) => (
            <li key={post._id}>
              <Link
                href={`/post/${post._id}`}
                className="flex items-start gap-2.5 rounded-chip px-2 py-1.5 transition-colors hover:bg-white/60"
              >
                <span className="w-4 shrink-0 font-bold text-brand-700 text-sm tabular-nums">
                  {index + 1}
                </span>
                <span className="line-clamp-2 min-w-0 flex-1 font-medium text-[0.9rem] text-ink-800 [overflow-wrap:anywhere]">
                  {post.title}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-ink-500 text-xs">
                  <Heart size={12} aria-hidden />
                  {post.likes ?? 0}
                  <span className="sr-only">個讚</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </RailCard>
  );
}

export function HomeRail() {
  return (
    <div className="flex flex-col gap-4">
      <UpcomingEvents />
      <RailCard icon={<Hash size={16} aria-hidden />} title="熱門標籤">
        <TopTags limit={12} />
      </RailCard>
      <HotPosts />
    </div>
  );
}

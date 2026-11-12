"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  errorText,
  useAdminSigs,
  useJoinRequests,
  useOpenReportCount,
  useOverview,
  useSigNames,
} from "./(admin)/api";
import { PageHeader } from "./(admin)/components/AdminShell";
import {
  Avatar,
  Badge,
  buttonClass,
  Card,
  EmptyState,
  ErrorState,
  linkClass,
  SkeletonRows,
} from "./(admin)/components/ui";
import { useAdmin } from "./(admin)/context";
import { daysSince, formatCount, formatRelative } from "./(admin)/format";
import type { AdminSig, JoinRequest } from "./(admin)/types";

// 總覽: what needs doing today. Admins get the platform numbers, open
// reports, pending join requests, SIGs without a leader or 指導老師, and
// the newest posts.
// SIG managers get their pending requests and their SIGs.

export default function AdminOverviewPage() {
  const admin = useAdmin();
  return admin.isAdmin ? <AdminOverview /> : <ManagerOverview />;
}

function today() {
  return new Date().toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function AdminOverview() {
  const overview = useOverview(true);
  const pending = useJoinRequests({ skip: 0, limit: 5, status: "pending" });
  const { names } = useSigNames();
  const data = overview.data;
  const oldest = daysSince(data?.pendingJoinRequests.oldestCreatedAt);
  // Shares the sidebar badge's cache; used when the overview has no count.
  const reportCount = useOpenReportCount(true);
  const openReports =
    typeof data?.openReports === "number"
      ? data.openReports
      : reportCount.isError
        ? null
        : reportCount.data;

  return (
    <>
      <PageHeader title="總覽" description={today()} />
      {overview.isError ? (
        <Card>
          <ErrorState
            message={errorText(overview.error)}
            onRetry={() => overview.refetch()}
          />
        </Card>
      ) : (
        <>
          {/* Phones: 2 + 2 + 1 wide; lg: the 3 totals over the 2 pending
              cards; xl: one row of 5. */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6 xl:grid-cols-5">
            <Kpi
              label="使用者"
              value={data?.users.total}
              delta={data?.users.last7d}
              className="lg:col-span-2 xl:col-span-1"
            />
            <Kpi
              label="貼文"
              value={data?.posts.total}
              delta={data?.posts.last7d}
              className="lg:col-span-2 xl:col-span-1"
            />
            <Kpi
              label="留言"
              value={data?.comments.total}
              delta={data?.comments.last7d}
              className="lg:col-span-2 xl:col-span-1"
            />
            <Kpi
              label="待審入社申請"
              value={data?.pendingJoinRequests.total}
              href="/admin/join-requests"
              className="lg:col-span-3 xl:col-span-1"
              note={
                data &&
                (data.pendingJoinRequests.total > 0 && oldest !== null ? (
                  <span className="text-warm-600">
                    最久 {oldest === 0 ? "不到 1" : oldest} 天
                  </span>
                ) : (
                  <span className="text-ink-500">沒有待審申請</span>
                ))
              }
            />
            <Kpi
              label="待處理檢舉"
              value={data ? openReports : undefined}
              href="/admin/reports"
              className="col-span-2 lg:col-span-3 xl:col-span-1"
              note={
                data &&
                (openReports === null ? (
                  <span className="text-ink-500">無法載入</span>
                ) : (
                  typeof openReports === "number" &&
                  (openReports > 0 ? (
                    <span className="text-danger-700">需要處理</span>
                  ) : (
                    <span className="text-ink-500">沒有待處理的檢舉</span>
                  ))
                ))
              }
            />
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <Card title="待處理" padded={false}>
              {overview.isPending || pending.isPending ? (
                <SkeletonRows rows={4} />
              ) : (
                <TodoList
                  openReports={openReports ?? 0}
                  requests={pending.data?.items ?? []}
                  moreRequests={
                    (pending.data?.total ?? 0) -
                    (pending.data?.items.length ?? 0)
                  }
                  requestError={
                    pending.isError ? errorText(pending.error) : null
                  }
                  withoutLeader={data?.sigsWithoutLeader ?? []}
                  withoutModerator={data?.sigsWithoutModerator ?? []}
                />
              )}
            </Card>
            <Card
              title="最新貼文"
              padded={false}
              actions={
                <Link
                  href="/admin/posts"
                  className={`${buttonClass("ghost", "sm")} mr-2`}
                >
                  全部貼文
                </Link>
              }
            >
              {overview.isPending ? (
                <SkeletonRows rows={5} />
              ) : (data?.recentPosts.length ?? 0) === 0 ? (
                <EmptyState title="還沒有貼文" />
              ) : (
                <ul className="pb-2">
                  {data?.recentPosts.map((post) => (
                    <li
                      key={post._id}
                      className="border-line border-t px-4 py-2.5 lg:px-5"
                    >
                      <Link
                        href={`/post/${post._id}`}
                        className="block truncate font-medium text-ink-900 text-sm hover:text-brand-700"
                      >
                        {post.title || "（無標題）"}
                      </Link>
                      <p className="mt-0.5 truncate text-ink-500 text-xs">
                        {names.get(post.sig) ?? "未知 SIG"} ·{" "}
                        {post.user?.name ?? "已刪除的使用者"} ·{" "}
                        {formatRelative(post.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function Kpi({
  label,
  value,
  delta,
  note,
  href,
  className: extra = "",
}: {
  label: string;
  /** undefined while loading; null when it could not be loaded. */
  value?: number | null;
  delta?: number;
  note?: ReactNode;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <p className="text-ink-500 text-xs">{label}</p>
      <p className="mt-1 font-bold text-2xl text-ink-900 tabular-nums">
        {value === undefined ? (
          <span className="inline-block h-7 w-16 animate-pulse rounded-chip bg-field align-middle" />
        ) : (
          formatCount(value)
        )}
      </p>
      <p className="mt-0.5 text-xs">
        {note ??
          (typeof delta === "number" && (
            <span className={delta > 0 ? "text-ok-700" : "text-ink-500"}>
              近 7 天 {delta > 0 ? "+" : ""}
              {formatCount(delta)}
            </span>
          ))}
      </p>
    </>
  );
  const className = `block rounded-card border border-line bg-surface p-4 shadow-card ${extra}`;
  return href ? (
    <Link href={href} className={`${className} hover:shadow-card-hover`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function TodoRow({
  badge,
  children,
  href,
  action,
}: {
  badge: ReactNode;
  children: ReactNode;
  href: string;
  action: string;
}) {
  return (
    <li className="flex items-center gap-2 border-line border-t px-4 py-2 lg:px-5">
      {badge}
      <span className="min-w-0 flex-1 truncate text-ink-800 text-sm">
        {children}
      </span>
      <Link href={href} className={buttonClass("secondary", "sm")}>
        {action}
      </Link>
    </li>
  );
}

function TodoList({
  openReports = 0,
  requests,
  moreRequests,
  requestError,
  withoutLeader,
  withoutModerator,
}: {
  openReports?: number;
  requests: JoinRequest[];
  moreRequests: number;
  requestError: string | null;
  withoutLeader: { _id: string; name: string }[];
  withoutModerator: { _id: string; name: string }[];
}) {
  const nothing =
    openReports <= 0 &&
    requests.length === 0 &&
    withoutLeader.length === 0 &&
    withoutModerator.length === 0 &&
    !requestError;
  if (nothing) {
    return <EmptyState title="目前沒有待處理的事項" />;
  }
  return (
    <ul className="pb-2">
      {openReports > 0 && (
        <TodoRow
          badge={<Badge tone="danger">檢舉</Badge>}
          href="/admin/reports"
          action="處理"
        >
          {formatCount(openReports)} 筆檢舉待處理
        </TodoRow>
      )}
      {requestError && (
        <li className="border-line border-t px-4 py-2 text-danger-700 text-sm lg:px-5">
          入社申請載入失敗：{requestError}
        </li>
      )}
      {requests.map((request) => (
        <TodoRow
          key={request._id}
          badge={<Badge tone="warn">申請</Badge>}
          href={`/admin/join-requests?sig=${request.sig?._id ?? ""}`}
          action="審核"
        >
          <b className="font-semibold">{request.user?.name ?? "某位同學"}</b>{" "}
          申請加入 {request.sig?.name ?? "SIG"}
          <span className="ml-1.5 text-ink-500 text-xs">
            {formatRelative(request.createdAt)}
          </span>
        </TodoRow>
      ))}
      {moreRequests > 0 && (
        <li className="border-line border-t px-4 py-2 text-sm lg:px-5">
          <Link href="/admin/join-requests" className={linkClass}>
            還有 {moreRequests} 筆待審申請
          </Link>
        </li>
      )}
      {withoutModerator.map((sig) => (
        <TodoRow
          key={`m-${sig._id}`}
          badge={<Badge tone="info">SIG</Badge>}
          href={`/admin/sigs/${sig._id}?tab=staff`}
          action="設定"
        >
          {sig.name} 尚未設定指導老師
        </TodoRow>
      ))}
      {withoutLeader.map((sig) => (
        <TodoRow
          key={`l-${sig._id}`}
          badge={<Badge tone="info">SIG</Badge>}
          href={`/admin/sigs/${sig._id}?tab=staff`}
          action="設定"
        >
          {sig.name} 尚未設定幹部
        </TodoRow>
      ))}
    </ul>
  );
}

function ManagerOverview() {
  const sigs = useAdminSigs();
  const pending = useJoinRequests({ skip: 0, limit: 5, status: "pending" });
  const list = sigs.data ?? [];

  return (
    <>
      <PageHeader title="總覽" description={today()} />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card
          title="待審入社申請"
          padded={false}
          actions={
            <Link
              href="/admin/join-requests"
              className={`${buttonClass("ghost", "sm")} mr-2`}
            >
              全部申請
            </Link>
          }
        >
          {pending.isPending ? (
            <SkeletonRows rows={3} />
          ) : pending.isError ? (
            <ErrorState
              message={errorText(pending.error)}
              onRetry={() => pending.refetch()}
            />
          ) : (pending.data?.items.length ?? 0) === 0 ? (
            <EmptyState title="目前沒有待審的申請" />
          ) : (
            <TodoList
              requests={pending.data?.items ?? []}
              moreRequests={
                (pending.data?.total ?? 0) - (pending.data?.items.length ?? 0)
              }
              requestError={null}
              withoutLeader={[]}
              withoutModerator={[]}
            />
          )}
        </Card>
        <section aria-labelledby="my-sigs">
          <h2 id="my-sigs" className="mb-2 font-bold text-base text-ink-900">
            我管理的 SIG
          </h2>
          {sigs.isPending ? (
            <Card padded={false}>
              <SkeletonRows rows={3} />
            </Card>
          ) : sigs.isError ? (
            <Card>
              <ErrorState
                message={errorText(sigs.error)}
                onRetry={() => sigs.refetch()}
              />
            </Card>
          ) : (
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
              {list.map((sig) => (
                <SigCard key={sig._id} sig={sig} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function SigCard({ sig }: { sig: AdminSig }) {
  const pending = sig.pendingJoinRequests ?? 0;
  return (
    <li>
      <Link
        href={`/admin/sigs/${sig._id}`}
        className="flex items-center gap-3 rounded-card border border-line bg-surface p-3 shadow-card hover:shadow-card-hover"
      >
        <Avatar src={sig.avatar} name={sig.name} size={40} square />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-ink-900 text-sm">
            {sig.name}
          </span>
          <span className="block truncate text-ink-500 text-xs">
            {formatCount(sig.memberCount)} 位成員 · 幹部 {sig.leaders.length} ·
            指導老師 {sig.moderators.length}
          </span>
        </span>
        {pending > 0 && <Badge tone="warn">{pending} 待審</Badge>}
        <ChevronRight aria-hidden className="size-4 text-ink-400" />
      </Link>
    </li>
  );
}

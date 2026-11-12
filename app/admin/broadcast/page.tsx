"use client";

import { useMemo } from "react";
import {
  errorText,
  useAdminSigs,
  useOverview,
  useSigNames,
} from "../(admin)/api";
import {
  type AudienceSig,
  BroadcastComposer,
} from "../(admin)/broadcast/BroadcastComposer";
import { PageHeader } from "../(admin)/components/AdminShell";
import {
  Card,
  EmptyState,
  ErrorState,
  SkeletonRows,
} from "../(admin)/components/ui";
import { useAdmin } from "../(admin)/context";
import { formatCount, formatDateTime, formatRelative } from "../(admin)/format";
import {
  BROADCASTS_PER_HOUR,
  useRecentBroadcasts,
} from "../(admin)/moderationApi";
import type { AuditEntry } from "../(admin)/types";

// 廣播通知 (contract v4 §5.5): send a notification to everyone (admins) or
// to one SIG (admins, and that SIG's leaders and 指導老師). Admins also see
// the recent broadcasts from the audit log.

export default function AdminBroadcastPage() {
  const admin = useAdmin();
  const sigs = useAdminSigs();
  // The user total, for an estimate if the backend cannot count.
  const overview = useOverview(admin.isAdmin);

  const audienceSigs = useMemo<AudienceSig[]>(
    () =>
      (sigs.data ?? []).map((sig) => ({
        _id: sig._id,
        name: sig.name,
        memberCount: sig.memberCount,
        managers: sig.leaders.length + sig.moderators.length,
      })),
    [sigs.data],
  );

  return (
    <>
      <PageHeader
        title="廣播通知"
        description={
          admin.isAdmin
            ? "傳送通知給全站使用者或某個 SIG 的成員。"
            : "傳送通知給你管理的 SIG 的成員、幹部與指導老師。"
        }
      />
      <Card>
        {sigs.isPending ? (
          <SkeletonRows rows={5} />
        ) : sigs.isError ? (
          <ErrorState
            message={errorText(sigs.error)}
            onRetry={() => sigs.refetch()}
          />
        ) : (
          <BroadcastComposer
            sigs={audienceSigs}
            allowAll={admin.isAdmin}
            estimateAll={overview.data?.users?.total}
          />
        )}
      </Card>
      <p className="mt-2 text-ink-500 text-xs">
        每位傳送者每小時最多 {BROADCASTS_PER_HOUR}{" "}
        則；收件人會在通知中心看到，關閉推播的人不會收到推播。
      </p>
      {admin.isAdmin && <RecentBroadcasts />}
    </>
  );
}

function audienceText(entry: AuditEntry, names: Map<string, string>) {
  const audience = entry.meta?.audience as
    | { type?: string; sig?: string; sigName?: string }
    | undefined;
  if (audience?.type === "sig") {
    return audience.sigName || names.get(audience.sig ?? "") || "SIG";
  }
  return "全站";
}

function RecentBroadcasts() {
  const recent = useRecentBroadcasts(true);
  const { names } = useSigNames();
  const items = recent.data?.items ?? [];

  return (
    <Card title="最近的廣播" padded={false} className="mt-4">
      {recent.isPending ? (
        <SkeletonRows rows={3} />
      ) : recent.isError ? (
        <ErrorState
          message={errorText(recent.error)}
          onRetry={() => recent.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState title="還沒有傳送過廣播" />
      ) : (
        <ul className="pb-2">
          {items.map((entry) => {
            const recipients = entry.meta?.recipients;
            return (
              <li
                key={entry._id}
                className="border-line border-t px-4 py-2.5 lg:px-5"
              >
                <p className="truncate font-medium text-ink-900 text-sm">
                  {entry.target.label || "（無標題）"}
                </p>
                <p className="mt-0.5 truncate text-ink-500 text-xs">
                  {audienceText(entry, names)} ·{" "}
                  {typeof recipients === "number"
                    ? `${formatCount(recipients)} 位`
                    : "—"}
                  {entry.meta?.push === true ? " · 推播" : ""} ·{" "}
                  {entry.actor?.name || "管理員"} ·{" "}
                  <time
                    dateTime={entry.createdAt}
                    title={formatDateTime(entry.createdAt)}
                  >
                    {formatRelative(entry.createdAt)}
                  </time>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

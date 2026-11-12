"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { errorText, useSigMembers } from "../../(admin)/api";
import { NotifyMembersButton } from "../../(admin)/broadcast/NotifyMembersButton";
import { JoinRequestList } from "../../(admin)/components/JoinRequests";
import {
  Avatar,
  Badge,
  buttonClass,
  Card,
  EmptyState,
  ErrorState,
  SkeletonRows,
} from "../../(admin)/components/ui";
import { canManageSig, useAdmin } from "../../(admin)/context";
import { formatCount } from "../../(admin)/format";
import { InfoTab } from "../../(admin)/sig/InfoTab";
import { MembersTab } from "../../(admin)/sig/MembersTab";
import { StaffTab } from "../../(admin)/sig/StaffTab";
import { useSigDetail } from "../../(admin)/sig/useSigDetail";
import { oneOf, useQueryState } from "../../(admin)/useQueryState";

// One SIG, everything in one place (?tab=): 基本資料, 幹部與老師, 成員,
// 入社申請. Leaders and 指導老師 reach only their own SIGs.

const TABS = ["info", "staff", "members", "requests"] as const;
type Tab = (typeof TABS)[number];

export default function AdminSigPage() {
  const { sigId } = useParams<{ sigId: string }>();
  const admin = useAdmin();
  const { get } = useQueryState();
  const tab = oneOf(get("tab"), TABS, "info");
  const allowed = canManageSig(admin, sigId);
  const detail = useSigDetail(sigId);
  const sig = detail.sig;
  // The count comes with the SIG; load the list only for the 成員 tab or
  // when the count is unknown (the announcement SIG).
  const members = useSigMembers(
    sigId,
    admin.isAdmin ? admin.token : null,
    allowed &&
      Boolean(sig) &&
      (tab === "members" || sig?.memberCount === undefined),
  );

  const back = (
    <Link
      href="/admin/sigs"
      className={`${buttonClass("ghost", "sm")} mb-2 -ml-2`}
    >
      <ArrowLeft aria-hidden className="size-4" />
      全部 SIG
    </Link>
  );

  if (!allowed || detail.notFound) {
    return (
      <>
        {back}
        <Card>
          <EmptyState title="找不到這個 SIG，或你沒有管理它的權限">
            請從 SIG 清單選擇要管理的 SIG。
          </EmptyState>
        </Card>
      </>
    );
  }

  if (detail.error) {
    return (
      <>
        {back}
        <Card>
          <ErrorState
            message={errorText(detail.error)}
            onRetry={detail.refetch}
          />
        </Card>
      </>
    );
  }

  if (!sig) {
    return (
      <>
        {back}
        <Card padded={false}>
          <SkeletonRows rows={4} />
        </Card>
      </>
    );
  }

  const memberCount = members.data?.length ?? sig.memberCount;
  const pending = sig.pendingJoinRequests;
  const tabs: { id: Tab; label: string; count?: number; warn?: boolean }[] = [
    { id: "info", label: "基本資料" },
    {
      id: "staff",
      label: "幹部與老師",
      warn: sig.leaders.length === 0 || sig.moderators.length === 0,
    },
    { id: "members", label: "成員", count: memberCount },
    {
      id: "requests",
      label: "入社申請",
      count: pending,
      warn: (pending ?? 0) > 0,
    },
  ];

  return (
    <>
      {back}
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <Avatar src={sig.avatar} name={sig.name} size={48} square />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold text-ink-900 text-lg lg:text-xl">
            {sig.name}
          </h1>
          <p className="truncate text-ink-500 text-sm">
            {sig.customId ? `@${sig.customId}` : ""}
            {typeof memberCount === "number" &&
              ` · ${formatCount(memberCount)} 位成員`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NotifyMembersButton sig={sig} memberCount={memberCount} />
          {sig.customId && (
            <Link
              href={`/@${sig.customId}`}
              target="_blank"
              className={buttonClass("secondary", "sm")}
            >
              <ExternalLink aria-hidden className="size-3.5" />
              在網站上查看
            </Link>
          )}
        </div>
      </header>

      <nav
        aria-label="SIG 管理"
        className="scrollbar-hide -mx-4 mb-4 flex gap-1 overflow-x-auto border-line-strong border-b px-4 lg:mx-0 lg:px-0"
      >
        {tabs.map((item) => {
          const active = item.id === tab;
          return (
            <Link
              key={item.id}
              href={
                item.id === "info"
                  ? `/admin/sigs/${sig._id}`
                  : `/admin/sigs/${sig._id}?tab=${item.id}`
              }
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={`-mb-px flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm transition-colors ${
                active
                  ? "border-brand-700 font-semibold text-brand-800"
                  : "border-transparent text-ink-500 hover:text-ink-800"
              }`}
            >
              {item.label}
              {typeof item.count === "number" &&
                (item.warn && item.count > 0 ? (
                  <Badge tone="warn">{item.count}</Badge>
                ) : (
                  <span className="text-ink-400 tabular-nums">
                    {formatCount(item.count)}
                  </span>
                ))}
              {item.warn && item.count === undefined && (
                <span
                  className="size-1.5 rounded-full bg-warm-600"
                  title="尚未設定幹部或指導老師"
                >
                  <span className="sr-only">（尚未設定齊全）</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {tab === "info" && <InfoTab sig={sig} />}
      {tab === "staff" && <StaffTab sig={sig} />}
      {tab === "members" && <MembersTab sig={sig} />}
      {tab === "requests" && <JoinRequestList fixedSig={sig._id} />}
    </>
  );
}

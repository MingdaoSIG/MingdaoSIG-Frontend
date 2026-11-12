"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { SIG_LIST_QUERY_KEY } from "@/utils/useAdminAccess";
import {
  adminKeys,
  errorText,
  failureMessage,
  send,
  useInvalidate,
} from "../api";
import { useConfirm } from "../components/Modal";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  linkClass,
  SkeletonRows,
} from "../components/ui";
import { formatCount } from "../format";
import { sigAdminKeys, useRolloverPreview } from "../sigAdminApi";
import type { RolloverPreview, RolloverResult } from "../types";

// 學年交接 step 1 (contract v4 §5.7): the alumni who are still SIG
// members, and the alumni leaders and 指導老師, from
// GET /admin/rollover/preview; then POST /admin/rollover/apply, first as
// a dry run for the confirm dialog.

const ROLE_LABEL = { leader: "幹部", moderator: "指導老師" } as const;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-control border border-line bg-surface px-3 py-2">
      <p className="text-ink-500 text-xs">{label}</p>
      <p className="font-bold text-ink-900 text-xl tabular-nums">
        {formatCount(value)}
      </p>
    </div>
  );
}

export function AlumniCleanup() {
  const preview = useRolloverPreview();
  return (
    <Card title="1. 畢業生整理">
      <p className="mb-4 max-w-3xl text-ink-500 text-sm">
        身分是「校友」但還在 SIG
        成員名單上的人，以及仍擔任幹部或指導老師的校友。先看清單，再決定要不要移出。
      </p>
      {preview.isError ? (
        <ErrorState
          message={errorText(preview.error)}
          onRetry={() => preview.refetch()}
        />
      ) : !preview.data ? (
        <SkeletonRows rows={4} />
      ) : (
        <Cleanup data={preview.data} />
      )}
    </Card>
  );
}

function Cleanup({ data }: { data: RolloverPreview }) {
  const confirm = useConfirm();
  const invalidate = useInvalidate();
  const members = data.alumniMembers ?? {
    users: 0,
    memberships: 0,
    bySig: [],
    list: [],
  };
  const managers = data.alumniManagers ?? [];
  const [removeMembers, setRemoveMembers] = useState(members.users > 0);
  const [removeManagers, setRemoveManagers] = useState(managers.length > 0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<RolloverResult | null>(null);
  const nothing = members.users === 0 && managers.length === 0;

  const apply = async () => {
    const options = {
      removeAlumniFromSigs: removeMembers,
      removeAlumniLeaders: removeManagers,
    };
    setBusy(true);
    const plan = await send<RolloverResult>("/admin/rollover/apply", {
      body: { ...options, dryRun: true },
    });
    setBusy(false);
    if (!plan.ok || !plan.data) {
      toast.error(
        plan.ok
          ? "伺服器的回應不完整"
          : failureMessage(plan, "只有管理員可以執行學年交接"),
      );
      return;
    }
    const parts: string[] = [];
    if (removeMembers) {
      parts.push(
        `把 ${formatCount(plan.data.users)} 位校友移出 SIG（共 ${formatCount(plan.data.memberships)} 筆成員資格）`,
      );
    }
    if (removeManagers) {
      parts.push(
        `移除 ${formatCount(plan.data.leadersRemoved)} 筆幹部、${formatCount(plan.data.moderatorsRemoved)} 筆指導老師`,
      );
    }
    const ok = await confirm({
      title: "套用學年交接？",
      description: (
        <>
          會{parts.join("，並")}
          。這些人的帳號、貼文和留言都會保留，但這個動作無法自動復原。
        </>
      ),
      confirmLabel: "套用",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    setBusy(true);
    const result = await send<RolloverResult>("/admin/rollover/apply", {
      body: options,
    });
    setBusy(false);
    if (!result.ok || !result.data) {
      toast.error(
        result.ok
          ? "伺服器的回應不完整，請重新整理確認結果"
          : failureMessage(result, "只有管理員可以執行學年交接"),
      );
      return;
    }
    setDone(result.data);
    toast.success("已套用學年交接");
    await invalidate(
      sigAdminKeys.rollover,
      adminKeys.sigs,
      adminKeys.users,
      adminKeys.overview,
      SIG_LIST_QUERY_KEY,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {done && (
        <p className="flex items-start gap-2 rounded-control bg-ok-50 px-3 py-2 text-ok-700 text-sm">
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" />
          已完成：移出 {formatCount(done.users)} 位校友的{" "}
          {formatCount(done.memberships)} 筆成員資格，移除{" "}
          {formatCount(done.leadersRemoved)} 筆幹部、
          {formatCount(done.moderatorsRemoved)} 筆指導老師。
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:max-w-xl">
        <Stat label="仍是成員的校友" value={members.users} />
        <Stat label="成員資格" value={members.memberships} />
        <Stat label="校友幹部／老師" value={managers.length} />
      </div>

      {nothing ? (
        <p className="text-ink-700 text-sm">
          目前沒有需要整理的校友，名單都是最新的。
        </p>
      ) : (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
            <section aria-label="各 SIG 的校友人數">
              <h3 className="mb-1.5 font-semibold text-ink-800 text-sm">
                各 SIG 的校友成員
              </h3>
              {members.bySig.length === 0 ? (
                <p className="text-ink-500 text-sm">沒有</p>
              ) : (
                <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-control border border-line">
                  {members.bySig.map((row) => (
                    <li
                      key={row.sig._id}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm"
                    >
                      <Link
                        href={`/admin/sigs/${row.sig._id}?tab=members`}
                        className={`${linkClass} min-w-0 flex-1 truncate`}
                      >
                        {row.sig.name || row.sig.customId || row.sig._id}
                      </Link>
                      {row.sig.archived && <Badge tone="mute">已封存</Badge>}
                      <span className="text-ink-700 tabular-nums">
                        {formatCount(row.count)} 位
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section aria-label="擔任幹部或指導老師的校友">
              <h3 className="mb-1.5 font-semibold text-ink-800 text-sm">
                擔任幹部或指導老師的校友
              </h3>
              {managers.length === 0 ? (
                <p className="text-ink-500 text-sm">沒有</p>
              ) : (
                <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-control border border-line">
                  {managers.map((item) => (
                    <li
                      key={`${item.sig._id}-${item.user._id}-${item.role}`}
                      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-3 py-1.5 text-sm"
                    >
                      <span className="font-medium text-ink-900">
                        {item.user.name || item.user.customId || "（未命名）"}
                      </span>
                      {item.user.class && (
                        <span className="text-ink-500 text-xs">
                          {item.user.class}
                        </span>
                      )}
                      <span className="flex-1" />
                      <Link
                        href={`/admin/sigs/${item.sig._id}?tab=staff`}
                        className={`${linkClass} text-xs`}
                      >
                        {item.sig.name}
                      </Link>
                      <Badge tone={item.role === "leader" ? "warn" : "info"}>
                        {ROLE_LABEL[item.role] ?? item.role}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {members.list.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-brand-700">
                查看全部 {formatCount(members.list.length)} 位校友
              </summary>
              <ul className="mt-2 max-h-72 divide-y divide-line overflow-y-auto rounded-control border border-line">
                {members.list.map((person) => (
                  <li
                    key={person._id}
                    className="flex items-center gap-2 px-3 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-ink-900">
                      {person.name || person.customId}
                      {person.customId && (
                        <span className="ml-1.5 text-ink-500 text-xs">
                          @{person.customId}
                        </span>
                      )}
                    </span>
                    <span className="text-ink-500 text-xs">
                      {person.class || "—"} · {person.sigs?.length ?? 0} 個 SIG
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <fieldset className="flex flex-col gap-2 border-line border-t pt-4">
            <legend className="sr-only">要做的整理</legend>
            <label className="flex cursor-pointer items-start gap-2 text-ink-800 text-sm">
              <input
                type="checkbox"
                checked={removeMembers}
                disabled={members.users === 0}
                onChange={(event) => setRemoveMembers(event.target.checked)}
                className="mt-0.5 size-4 cursor-pointer accent-brand-700"
              />
              <span>
                把校友移出所有 SIG（{formatCount(members.users)} 位，
                {formatCount(members.memberships)} 筆成員資格）
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-ink-800 text-sm">
              <input
                type="checkbox"
                checked={removeManagers}
                disabled={managers.length === 0}
                onChange={(event) => setRemoveManagers(event.target.checked)}
                className="mt-0.5 size-4 cursor-pointer accent-brand-700"
              />
              <span>
                移除擔任幹部或指導老師的校友（{formatCount(managers.length)}{" "}
                筆）
              </span>
            </label>
          </fieldset>
          <div>
            <Button
              variant="primary"
              onClick={apply}
              loading={busy}
              disabled={!removeMembers && !removeManagers}
            >
              檢查並套用…
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

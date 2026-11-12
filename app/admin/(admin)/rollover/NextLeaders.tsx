"use client";

import { Plus, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { SIG_LIST_QUERY_KEY } from "@/utils/useAdminAccess";
import {
  adminKeys,
  errorText,
  failureMessage,
  send,
  useAdminSigs,
  useInvalidate,
} from "../api";
import { Modal } from "../components/Modal";
import { UserPickerDialog } from "../components/UserPicker";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  linkClass,
  SkeletonRows,
  selectClass,
} from "../components/ui";
import { useRolloverPreview } from "../sigAdminApi";
import type {
  AdminSig,
  LeaderBatchItem,
  LeaderBatchResult,
  UserRef,
} from "../types";

// 學年交接 step 2 (contract v4 §5.7): next year's leaders for many SIGs
// at once. Each SIG gets a list and a mode (取代: the list becomes the
// leaders; 加入: added to the current ones). A dry run of
// POST /admin/sigs/leaders/batch shows the changes before they apply.

type Mode = "replace" | "add";
type Draft = { leaders: UserRef[]; mode: Mode };

function nameOf(person: UserRef) {
  return person.name || person.customId || "（未命名）";
}

export function NextLeaders() {
  const sigs = useAdminSigs();
  const preview = useRolloverPreview();
  const invalidate = useInvalidate();
  const [drafts, setDrafts] = useState<Map<string, Draft>>(new Map());
  const [picking, setPicking] = useState<AdminSig | null>(null);
  const [plan, setPlan] = useState<LeaderBatchResult | null>(null);
  const [busy, setBusy] = useState<"plan" | "apply" | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  const alumni = useMemo(() => {
    const ids = new Set<string>();
    for (const item of preview.data?.alumniManagers ?? []) {
      ids.add(item.user._id);
    }
    return ids;
  }, [preview.data]);

  const rows = sigs.data ?? [];
  const names = new Map(rows.map((sig) => [sig._id, sig.name]));
  const assignments = Array.from(drafts.entries())
    .filter(([, draft]) => draft.leaders.length > 0)
    .map(([sig, draft]) => ({
      sig,
      leaders: draft.leaders.map((person) => person._id),
      mode: draft.mode,
    }));

  const update = (sigId: string, next: Draft | null) =>
    setDrafts((prev) => {
      const copy = new Map(prev);
      if (next) {
        copy.set(sigId, next);
      } else {
        copy.delete(sigId);
      }
      return copy;
    });

  const run = async (dryRun: boolean) => {
    if (assignments.length === 0) {
      return;
    }
    setBusy(dryRun ? "plan" : "apply");
    const result = await send<LeaderBatchResult>("/admin/sigs/leaders/batch", {
      body: { assignments, dryRun },
    });
    setBusy(null);
    if (!result.ok || !result.data) {
      toast.error(
        result.ok
          ? "伺服器的回應不完整"
          : failureMessage(result, "只有管理員可以設定幹部"),
      );
      return;
    }
    if (dryRun) {
      setPlan(result.data);
      return;
    }
    const notApplied = (result.data.results ?? [])
      .filter((item) => !item.applied)
      .map((item) => item.sig);
    setSkipped(notApplied);
    setPlan(null);
    setDrafts((prev) => {
      const copy = new Map<string, Draft>();
      for (const id of notApplied) {
        const draft = prev.get(id);
        if (draft) {
          copy.set(id, draft);
        }
      }
      return copy;
    });
    toast.success(
      `已更新幹部：新增 ${result.data.added} 位、移除 ${result.data.removed} 位`,
    );
    await invalidate(adminKeys.sigs, adminKeys.overview, SIG_LIST_QUERY_KEY);
  };

  const pickingDraft = picking ? drafts.get(picking._id) : undefined;

  return (
    <Card title="2. 下一屆幹部">
      <p className="mb-4 max-w-3xl text-ink-500 text-sm">
        為每個 SIG
        指定下一屆的幹部，一次套用。「取代」會讓名單上的人成為全部的幹部；「加入」保留現任幹部，再加入名單上的人。只有填了名單的
        SIG 會變更。
      </p>
      {skipped.length > 0 && (
        <p className="mb-3 flex gap-2 rounded-control bg-warm-50 px-3 py-2 text-sm text-warm-600">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {skipped.map((id) => names.get(id) ?? id).join("、")}{" "}
          的幹部在這段時間被修改過，所以沒有套用。名單還留著，請確認後再套用一次。
        </p>
      )}
      {sigs.isError ? (
        <ErrorState
          message={errorText(sigs.error)}
          onRetry={() => sigs.refetch()}
        />
      ) : sigs.isPending ? (
        <SkeletonRows rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState title="沒有 SIG" />
      ) : (
        <ul className="divide-y divide-line rounded-control border border-line">
          {rows.map((sig) => {
            const draft = drafts.get(sig._id);
            return (
              <li
                key={sig._id}
                className="grid grid-cols-[minmax(0,1fr)] gap-2 px-3 py-3 lg:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1.3fr)_7.5rem] lg:items-center"
              >
                <Link
                  href={`/admin/sigs/${sig._id}?tab=staff`}
                  className={`${linkClass} truncate font-semibold text-sm`}
                >
                  {sig.name}
                </Link>
                <div className="min-w-0 text-sm">
                  <span className="mr-1 text-ink-500 text-xs lg:hidden">
                    現任：
                  </span>
                  {sig.leaders.length === 0 ? (
                    <span className="text-ink-400">尚無幹部</span>
                  ) : (
                    <span className="inline-flex flex-wrap gap-1">
                      {sig.leaders.map((person) => (
                        <span
                          key={person._id}
                          className={`inline-flex items-center gap-1 ${
                            draft?.mode === "replace" &&
                            !draft.leaders.some((p) => p._id === person._id)
                              ? "text-ink-400 line-through"
                              : "text-ink-700"
                          }`}
                        >
                          {nameOf(person)}
                          {alumni.has(person._id) && (
                            <Badge tone="warn">校友</Badge>
                          )}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  <span className="mr-1 text-ink-500 text-xs lg:hidden">
                    下一屆：
                  </span>
                  {draft?.leaders.map((person) => (
                    <span
                      key={person._id}
                      className="inline-flex h-7 items-center gap-1 rounded-chip bg-brand-50 pr-0.5 pl-2 text-brand-800 text-xs"
                    >
                      {nameOf(person)}
                      <button
                        type="button"
                        aria-label={`移除 ${nameOf(person)}`}
                        onClick={() => {
                          const leaders = draft.leaders.filter(
                            (p) => p._id !== person._id,
                          );
                          update(
                            sig._id,
                            leaders.length > 0 ? { ...draft, leaders } : null,
                          );
                        }}
                        className="flex size-6 cursor-pointer items-center justify-center rounded-chip hover:bg-brand-700/10"
                      >
                        <X aria-hidden className="size-3" />
                      </button>
                    </span>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPicking(sig)}
                    aria-label={`為 ${sig.name} 新增下一屆幹部`}
                  >
                    <Plus aria-hidden className="size-3.5" />
                    新增
                  </Button>
                </div>
                <div>
                  <label className="sr-only" htmlFor={`mode-${sig._id}`}>
                    {sig.name} 的套用方式
                  </label>
                  <select
                    id={`mode-${sig._id}`}
                    value={draft?.mode ?? "replace"}
                    disabled={!draft}
                    onChange={(event) =>
                      draft &&
                      update(sig._id, {
                        ...draft,
                        mode: event.target.value as Mode,
                      })
                    }
                    className={selectClass}
                  >
                    <option value="replace">取代現任</option>
                    <option value="add">加入現任</option>
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-ink-700 text-sm">
          已設定 {assignments.length} 個 SIG
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDrafts(new Map())}
          disabled={drafts.size === 0}
        >
          全部清除
        </Button>
        <Button
          variant="primary"
          onClick={() => run(true)}
          loading={busy === "plan"}
          disabled={assignments.length === 0}
        >
          預覽變更
        </Button>
      </div>

      <UserPickerDialog
        open={Boolean(picking)}
        title={picking ? `${picking.name} 的下一屆幹部` : ""}
        taken={pickingDraft?.leaders.map((p) => p._id) ?? []}
        takenLabel="已在名單"
        onClose={() => setPicking(null)}
        onPick={(user) => {
          if (!picking) {
            return;
          }
          const current = drafts.get(picking._id) ?? {
            leaders: [],
            mode: "replace" as Mode,
          };
          update(picking._id, {
            ...current,
            leaders: [
              ...current.leaders,
              {
                _id: user._id,
                name: user.name,
                customId: user.customId,
                avatar: user.avatar,
              },
            ],
          });
          toast.success(`已加入名單：${user.name ?? user.customId}`);
        }}
      />

      <Modal
        open={Boolean(plan)}
        onClose={() => (busy === "apply" ? undefined : setPlan(null))}
        wide
        title="套用下一屆幹部？"
        description={
          plan
            ? `會新增 ${plan.added} 位、移除 ${plan.removed} 位幹部，每一筆都會記在操作紀錄。`
            : ""
        }
        footer={
          <>
            <Button onClick={() => setPlan(null)} disabled={busy === "apply"}>
              返回修改
            </Button>
            <Button
              variant="primary"
              onClick={() => run(false)}
              loading={busy === "apply"}
              disabled={!plan || plan.added + plan.removed === 0}
            >
              確定套用
            </Button>
          </>
        }
      >
        {plan && <PlanList items={plan.results ?? []} names={names} />}
      </Modal>
    </Card>
  );
}

function PlanList({
  items,
  names,
}: {
  items: LeaderBatchItem[];
  names: Map<string, string>;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.sig}
          className="rounded-control border border-line px-3 py-2 text-sm"
        >
          <p className="font-semibold text-ink-900">
            {names.get(item.sig) ?? item.sig}
          </p>
          {item.added.length === 0 && item.removed.length === 0 ? (
            <p className="text-ink-500">沒有變更（名單和現任相同）</p>
          ) : (
            <>
              {item.added.length > 0 && (
                <p className="text-ok-700">
                  ＋ {item.added.map(nameOf).join("、")}
                </p>
              )}
              {item.removed.length > 0 && (
                <p className="text-danger-700">
                  － {item.removed.map(nameOf).join("、")}
                </p>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

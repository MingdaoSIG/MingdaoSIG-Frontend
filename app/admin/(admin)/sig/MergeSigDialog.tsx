"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { ANNOUNCEMENT_SIG_ID } from "@/utils/useAdminAccess";
import {
  adminKeys,
  failureMessage,
  send,
  useAdminSigs,
  useInvalidate,
} from "../api";
import { Modal } from "../components/Modal";
import { Button, Spinner, selectClass } from "../components/ui";
import { formatCount } from "../format";
import { useRefreshSigs } from "../sigAdminApi";
import type { AdminSig, MergeResult, UserRef } from "../types";

// 合併 SIG (contract v4 §5.7): pick the SIG to merge into, see a dry run
// (POST /admin/sigs/:id/merge { into, dryRun: true }) and confirm. The
// source is archived; its posts, members and pending requests move, and
// its addresses redirect. Leaders and 指導老師 are not moved: the summary
// lists them so they can be set on the target by hand.

function people(list: UserRef[]) {
  return list.map((p) => p.name || p.customId || "（未命名）").join("、");
}

export function MergeSigDialog({
  sig,
  open,
  onClose,
}: {
  sig: AdminSig;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const selectId = useId();
  const sigs = useAdminSigs(open);
  const refresh = useRefreshSigs();
  const invalidate = useInvalidate();
  const [into, setInto] = useState("");
  const [plan, setPlan] = useState<MergeResult | null>(null);
  const [busy, setBusy] = useState<"plan" | "apply" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setInto("");
      setPlan(null);
      setError("");
      setBusy(null);
    }
  }, [open]);

  const targets = useMemo(
    () =>
      (sigs.data ?? []).filter(
        (s) => s._id !== sig._id && s._id !== ANNOUNCEMENT_SIG_ID,
      ),
    [sigs.data, sig._id],
  );
  const target = targets.find((s) => s._id === into);

  const run = async (dryRun: boolean) => {
    if (!into) {
      setError("請選擇要合併進去的 SIG");
      return;
    }
    setBusy(dryRun ? "plan" : "apply");
    setError("");
    const result = await send<MergeResult>(`/admin/sigs/${sig._id}/merge`, {
      body: { into, dryRun },
    });
    setBusy(null);
    if (!result.ok || !result.data) {
      const message = result.ok
        ? "伺服器的回應不完整，請重新整理後確認結果"
        : failureMessage(result, "只有管理員可以合併 SIG");
      setError(message);
      if (!dryRun) {
        toast.error(message);
      }
      return;
    }
    if (dryRun) {
      setPlan(result.data);
      return;
    }
    toast.success(`已把 ${sig.name} 合併到 ${target?.name ?? "目標 SIG"}`);
    await Promise.all([
      refresh(sig._id),
      invalidate(adminKeys.posts, adminKeys.joinRequests, adminKeys.users),
    ]);
    onClose();
    router.push(`/admin/sigs/${into}`);
  };

  const footer = plan ? (
    <>
      <Button onClick={() => setPlan(null)} disabled={busy === "apply"}>
        上一步
      </Button>
      <Button
        variant="danger"
        onClick={() => run(false)}
        loading={busy === "apply"}
      >
        確定合併
      </Button>
    </>
  ) : (
    <>
      <Button onClick={onClose}>取消</Button>
      <Button
        variant="primary"
        onClick={() => run(true)}
        loading={busy === "plan"}
        disabled={!into}
      >
        預覽合併結果
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={busy === "apply" ? () => undefined : onClose}
      wide
      title={`合併 ${sig.name}`}
      description="把這個 SIG 的貼文、成員和待審申請併到另一個 SIG，然後封存這個 SIG。"
      footer={footer}
    >
      {!plan ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={selectId}
            className="font-semibold text-ink-700 text-xs"
          >
            合併到
          </label>
          {sigs.isPending ? (
            <Spinner />
          ) : (
            <select
              id={selectId}
              value={into}
              onChange={(event) => {
                setInto(event.target.value);
                setError("");
              }}
              className={selectClass}
            >
              <option value="">選擇 SIG…</option>
              {targets.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                  {s.customId ? `（@${s.customId}）` : ""}
                </option>
              ))}
            </select>
          )}
          <p className="text-ink-500 text-xs">
            下一步會先試算，確認數字後才會真的合併。
          </p>
        </div>
      ) : (
        <MergeSummary plan={plan} sourceName={sig.name} />
      )}
      {error && (
        <p role="alert" className="mt-3 text-danger-700 text-sm">
          {error}
        </p>
      )}
    </Modal>
  );
}

function MergeSummary({
  plan,
  sourceName,
}: {
  plan: MergeResult;
  sourceName: string;
}) {
  const intoName = plan.into?.name || "目標 SIG";
  const managers = [...(plan.leaders ?? []), ...(plan.moderators ?? [])];
  const rows: { label: string; value: string }[] = [
    {
      label: "貼文",
      value: `${formatCount(plan.posts)} 篇搬到 ${intoName}${
        plan.covers
          ? `（其中 ${formatCount(plan.covers)} 篇的預設封面會換成 ${intoName} 的）`
          : ""
      }`,
    },
    {
      label: "成員",
      value: `${formatCount(plan.members?.added ?? 0)} 位加入 ${intoName}${
        plan.members?.alreadyInTarget
          ? `，${formatCount(plan.members.alreadyInTarget)} 位原本就是成員`
          : ""
      }`,
    },
    {
      label: "待審申請",
      value:
        `${formatCount(plan.joinRequests?.moved ?? 0)} 筆轉到 ${intoName}` +
        (plan.joinRequests?.rejected
          ? `，${formatCount(plan.joinRequests.rejected)} 筆因為申請人已是成員或已在申請中而拒絕`
          : ""),
    },
    {
      label: "舊網址",
      value:
        (plan.previousCustomIds ?? []).length > 0
          ? `${plan.previousCustomIds.map((id) => `/@${id}`).join("、")} 會轉到 ${intoName}`
          : "沒有",
    },
  ];
  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-900 text-sm">
        {sourceName}
        <ArrowRight aria-hidden className="size-4 text-ink-400" />
        {intoName}
        <span className="font-normal text-ink-500 text-xs">（試算結果）</span>
      </p>
      <dl className="divide-y divide-line rounded-control border border-line">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 px-3 py-2 text-sm"
          >
            <dt className="text-ink-500">{row.label}</dt>
            <dd className="text-ink-800">{row.value}</dd>
          </div>
        ))}
      </dl>
      {managers.length > 0 && (
        <p className="rounded-control bg-warm-50 px-3 py-2 text-sm text-warm-600">
          幹部與指導老師不會搬過去
          {plan.leaders?.length ? `（幹部：${people(plan.leaders)}）` : ""}
          {plan.moderators?.length
            ? `（指導老師：${people(plan.moderators)}）`
            : ""}
          ，需要的話請到 {intoName} 的「幹部與老師」設定。
        </p>
      )}
      <p className="text-danger-700 text-sm">
        合併後 {sourceName} 會被封存，這個動作無法自動復原。
      </p>
    </div>
  );
}

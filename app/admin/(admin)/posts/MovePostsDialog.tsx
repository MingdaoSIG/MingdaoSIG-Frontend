"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { ANNOUNCEMENT_SIG_ID } from "@/utils/useAdminAccess";
import {
  adminKeys,
  failureMessage,
  send,
  useInvalidate,
  useSigNames,
} from "../api";
import { Modal } from "../components/Modal";
import { Button, selectClass } from "../components/ui";
import { formatCount } from "../format";
import type { MovePostsResult } from "../types";

// 搬移到其他 SIG (contract v4 §5.7): POST /admin/posts/move with the
// selected posts (`ids`, up to 500) or every post of one SIG
// (`fromSig`), and `toSig`. A dry run first shows how many posts move.

export type MoveSelection =
  | { ids: string[] }
  | { fromSig: string; fromName: string };

const MAX_IDS = 500;

export function MovePostsDialog({
  selection,
  onClose,
  onMoved,
}: {
  /** What to move; null closes the dialog. */
  selection: MoveSelection | null;
  onClose: () => void;
  onMoved?: (result: MovePostsResult) => void;
}) {
  const selectId = useId();
  const { names, sigs } = useSigNames(Boolean(selection));
  const invalidate = useInvalidate();
  const [toSig, setToSig] = useState("");
  const [plan, setPlan] = useState<MovePostsResult | null>(null);
  const [busy, setBusy] = useState<"plan" | "apply" | null>(null);
  const [error, setError] = useState("");
  const open = Boolean(selection);

  useEffect(() => {
    if (open) {
      setToSig("");
      setPlan(null);
      setBusy(null);
      setError("");
    }
  }, [open]);

  const fromSig = selection && "fromSig" in selection ? selection.fromSig : "";
  const count = selection && "ids" in selection ? selection.ids.length : null;
  const tooMany = count !== null && count > MAX_IDS;
  const targets = [
    ...sigs.filter((sig) => sig._id !== fromSig),
    ...(fromSig === ANNOUNCEMENT_SIG_ID
      ? []
      : [{ _id: ANNOUNCEMENT_SIG_ID, name: "公告" }]),
  ];
  const targetName = names.get(toSig) ?? "目標 SIG";

  const run = async (dryRun: boolean) => {
    if (!selection || !toSig || tooMany) {
      return;
    }
    setBusy(dryRun ? "plan" : "apply");
    setError("");
    const body =
      "ids" in selection
        ? { ids: selection.ids, toSig, dryRun }
        : { fromSig: selection.fromSig, toSig, dryRun };
    const result = await send<MovePostsResult>("/admin/posts/move", { body });
    setBusy(null);
    if (!result.ok || !result.data) {
      const message = result.ok
        ? "伺服器的回應不完整，請重新整理後確認結果"
        : failureMessage(result, "只有管理員可以搬移貼文");
      setError(message);
      return;
    }
    if (dryRun) {
      setPlan(result.data);
      return;
    }
    toast.success(
      `已把 ${formatCount(result.data.count)} 篇貼文搬到 ${targetName}`,
    );
    await invalidate(adminKeys.posts, adminKeys.overview);
    onMoved?.(result.data);
    onClose();
  };

  const subject =
    selection && "ids" in selection
      ? `選取的 ${formatCount(selection.ids.length)} 篇貼文`
      : selection
        ? `${selection.fromName} 的全部貼文`
        : "";

  return (
    <Modal
      open={open}
      onClose={busy === "apply" ? () => undefined : onClose}
      title="搬移到其他 SIG"
      description={subject}
      footer={
        plan ? (
          <>
            <Button onClick={() => setPlan(null)} disabled={busy === "apply"}>
              上一步
            </Button>
            <Button
              variant="primary"
              onClick={() => run(false)}
              loading={busy === "apply"}
              disabled={plan.count === 0}
            >
              確定搬移 {formatCount(plan.count)} 篇
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>取消</Button>
            <Button
              variant="primary"
              onClick={() => run(true)}
              loading={busy === "plan"}
              disabled={!toSig || tooMany}
            >
              預覽
            </Button>
          </>
        )
      }
    >
      {plan ? (
        <div className="flex flex-col gap-2 text-sm">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-900">
            {selection && "fromName" in selection
              ? selection.fromName
              : "選取的貼文"}
            <ArrowRight aria-hidden className="size-4 text-ink-400" />
            {targetName}
          </p>
          {plan.count === 0 ? (
            <p className="text-ink-700">
              沒有需要搬移的貼文（可能都已經在 {targetName}）。
            </p>
          ) : (
            <p className="text-ink-700">
              {formatCount(plan.count)} 篇貼文會搬到 {targetName}。
              {plan.covers
                ? `其中 ${formatCount(plan.covers)} 篇使用原本 SIG 的預設封面，會換成 ${targetName} 的。`
                : ""}
            </p>
          )}
          <p className="text-ink-500 text-xs">
            貼文的作者、讚和留言都不會變；最後更新時間不會改動。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={selectId}
            className="font-semibold text-ink-700 text-xs"
          >
            搬到
          </label>
          <select
            id={selectId}
            value={toSig}
            onChange={(event) => {
              setToSig(event.target.value);
              setError("");
            }}
            className={selectClass}
          >
            <option value="">選擇 SIG…</option>
            {targets.map((sig) => (
              <option key={sig._id} value={sig._id}>
                {sig.name}
              </option>
            ))}
          </select>
          {tooMany && (
            <p className="text-danger-700 text-xs">
              一次最多搬移 {MAX_IDS} 篇，請減少選取的貼文。
            </p>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-danger-700 text-sm">
          {error}
        </p>
      )}
    </Modal>
  );
}

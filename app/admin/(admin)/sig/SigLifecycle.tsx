"use client";

import { Archive, ArchiveRestore, Merge } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { ANNOUNCEMENT_SIG_ID } from "@/utils/useAdminAccess";
import { send } from "../api";
import { useConfirm } from "../components/Modal";
import { Badge, Button, Card } from "../components/ui";
import { sigWriteFailure, useRefreshSigs } from "../sigAdminApi";
import type { AdminSig } from "../types";
import { useQueryState } from "../useQueryState";
import { MergeSigDialog } from "./MergeSigDialog";

// 封存／恢復 and 合併 SIG, admin only (contract v4 §3.7, §5.7). The
// announcement SIG is stored as archived on purpose and in use, so it can
// be neither archived, restored nor merged.

export function SigLifecycle({ sig }: { sig: AdminSig }) {
  const confirm = useConfirm();
  const refresh = useRefreshSigs();
  const [busy, setBusy] = useState(false);
  const [merging, setMerging] = useState(false);
  const isAnnouncement = sig._id === ANNOUNCEMENT_SIG_ID;
  const archived = Boolean(sig.archived) && !isAnnouncement;
  const { get, set } = useQueryState();
  const askedToMerge = get("merge") === "1";

  // 學年交接 links here with ?merge=1: open the merge dialog once.
  useEffect(() => {
    if (askedToMerge) {
      if (!archived && !isAnnouncement) {
        setMerging(true);
      }
      set({ merge: null }, { replace: true, keepPage: true });
    }
  }, [askedToMerge]);

  const setArchived = async (removed: boolean) => {
    const ok = await confirm(
      removed
        ? {
            title: `封存 ${sig.name}？`,
            description:
              "封存後 SIG 不會出現在網站的 SIG 列表，也不能再發文或申請加入；貼文和成員都會保留。之後可以在「已封存」中恢復。",
            confirmLabel: "封存",
            tone: "danger",
          }
        : {
            title: `恢復 ${sig.name}？`,
            description: "SIG 會重新出現在網站上，可以發文和申請加入。",
            confirmLabel: "恢復",
          },
    );
    if (!ok) {
      return;
    }
    setBusy(true);
    const result = await send(`/sig/${sig._id}`, { body: { removed } });
    setBusy(false);
    if (!result.ok) {
      toast.error(sigWriteFailure(result));
      return;
    }
    toast.success(removed ? `已封存 ${sig.name}` : `已恢復 ${sig.name}`);
    await refresh(sig._id);
  };

  if (isAnnouncement) {
    return (
      <Card title="封存與合併">
        <p className="text-ink-500 text-sm">
          公告 SIG
          固定以「封存」狀態運作，仍在使用中，所以不能封存、恢復或合併。
        </p>
      </Card>
    );
  }

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          封存與合併
          {archived && <Badge tone="mute">已封存</Badge>}
        </span>
      }
      actions={<span className="text-ink-500 text-xs">只有管理員可以操作</span>}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-ink-800 text-sm">
              {archived ? "恢復 SIG" : "封存 SIG"}
            </p>
            <p className="text-ink-500 text-sm">
              {archived
                ? "這個 SIG 已封存，網站上看不到，也不能發文或申請加入。"
                : "不再使用的 SIG 可以封存，貼文和成員都會保留。"}
            </p>
          </div>
          {archived ? (
            <Button onClick={() => setArchived(false)} loading={busy}>
              <ArchiveRestore aria-hidden className="size-4" />
              恢復 SIG
            </Button>
          ) : (
            <Button
              variant="danger-outline"
              onClick={() => setArchived(true)}
              loading={busy}
            >
              <Archive aria-hidden className="size-4" />
              封存 SIG
            </Button>
          )}
        </div>
        {!archived && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-line border-t pt-4">
            <div className="min-w-0">
              <p className="font-semibold text-ink-800 text-sm">合併 SIG</p>
              <p className="text-ink-500 text-sm">
                把貼文、成員和待審申請併到另一個 SIG，舊網址會轉過去，這個 SIG
                會被封存。
              </p>
            </div>
            <Button variant="danger-outline" onClick={() => setMerging(true)}>
              <Merge aria-hidden className="size-4" />
              合併 SIG
            </Button>
          </div>
        )}
      </div>
      <MergeSigDialog
        sig={sig}
        open={merging}
        onClose={() => setMerging(false)}
      />
    </Card>
  );
}

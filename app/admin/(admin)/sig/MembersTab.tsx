"use client";

import { Download, UserMinus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { CustomStatus } from "@/modules/customStatusCode";
import {
  adminKeys,
  errorText,
  failureMessage,
  send,
  useInvalidate,
  useSigMembers,
} from "../api";
import { type Column, DataTable, Truncate } from "../components/DataTable";
import { FilterBar, SearchBox } from "../components/Filters";
import { ListCard } from "../components/ListCard";
import { useConfirm } from "../components/Modal";
import { Avatar, Button } from "../components/ui";
import { useAdmin } from "../context";
import { formatCount, IDENTITY_LABEL } from "../format";
import type { AdminSig, SigMember } from "../types";
import { useQueryState } from "../useQueryState";
import { downloadMembers } from "../xlsx";

// 成員: everyone with this SIG in their profile. Leaders, 指導老師 and
// admins can remove a member and download the list as Excel.

export function MembersTab({ sig }: { sig: AdminSig }) {
  const admin = useAdmin();
  const { get, set } = useQueryState();
  const q = get("q");
  const members = useSigMembers(sig._id, admin.isAdmin ? admin.token : null);
  const confirm = useConfirm();
  const invalidate = useInvalidate();
  const [busy, setBusy] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const all = members.data ?? [];
  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    if (!needle) {
      return all;
    }
    return all.filter((m) =>
      [m.name, m.code, m.email, m.class, m.customId].some((value) =>
        (value ?? "").toLowerCase().includes(needle),
      ),
    );
  }, [all, q]);

  const remove = async (member: SigMember) => {
    const ok = await confirm({
      title: `把 ${member.name || "這位成員"} 移出 ${sig.name}？`,
      description:
        "對方不會再是這個 SIG 的成員，也不能在這個 SIG 發文；之後可以再申請加入。",
      confirmLabel: "移出 SIG",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    setBusy(member._id);
    const result = await send(`/sig/${sig._id}/members/${member._id}`, {
      method: "DELETE",
    });
    setBusy(null);
    if (!result.ok) {
      if (result.status === CustomStatus.NOT_A_MEMBER) {
        toast.error(`${member.name || "對方"} 已經不是這個 SIG 的成員了`);
        await invalidate(adminKeys.sigMembers(sig._id), adminKeys.sigs);
        return;
      }
      toast.error(failureMessage(result, "你沒有權限移除這個 SIG 的成員"));
      return;
    }
    toast.success(`已將 ${member.name || "成員"} 移出 SIG`);
    await invalidate(adminKeys.sigMembers(sig._id), adminKeys.sigs);
  };

  const download = async () => {
    if (all.length === 0) {
      toast.error("沒有成員資料可以下載");
      return;
    }
    setDownloading(true);
    try {
      await downloadMembers(sig.name, all);
      toast.success(`已下載 ${all.length} 位成員的名單`);
    } catch (error) {
      console.error("Member export failed:", error);
      toast.error("下載失敗，請稍後再試");
    } finally {
      setDownloading(false);
    }
  };

  const removeButton = (member: SigMember) => (
    <Button
      size="sm"
      variant="danger-outline"
      onClick={() => remove(member)}
      loading={busy === member._id}
      aria-label={`把 ${member.name ?? ""} 移出 SIG`}
    >
      <UserMinus aria-hidden className="size-3.5" />
      移出
    </Button>
  );

  const columns: Column<SigMember>[] = [
    {
      key: "name",
      header: "成員",
      cell: (m) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar src={m.avatar} name={m.name} size={28} />
          <span className="min-w-0">
            <Truncate className="font-medium text-ink-900">
              {m.name || "（未命名）"}
            </Truncate>
            <Truncate className="text-ink-500 text-xs">
              {m.customId ? `@${m.customId}` : "—"}
            </Truncate>
          </span>
        </span>
      ),
    },
    {
      key: "code",
      header: "學號",
      className: "w-[7rem]",
      cell: (m) => <Truncate>{m.code || "—"}</Truncate>,
    },
    {
      key: "class",
      header: "班級／身分",
      className: "w-[7.5rem]",
      cell: (m) => (
        <Truncate>
          {[m.class, IDENTITY_LABEL[m.identity ?? ""]]
            .filter(Boolean)
            .join(" · ") || "—"}
        </Truncate>
      ),
    },
    {
      key: "email",
      header: "Email",
      className: "w-[30%]",
      cell: (m) => <Truncate>{m.email || "—"}</Truncate>,
    },
    {
      key: "actions",
      header: <span className="sr-only">動作</span>,
      className: "w-[6rem] text-right",
      cell: removeButton,
    },
  ];

  return (
    <ListCard
      toolbar={
        <FilterBar>
          <SearchBox
            value={q}
            onCommit={(next) => set({ q: next }, { replace: true })}
            label="搜尋成員"
            placeholder="姓名、學號、班級或 Email…"
            className="sm:flex-1"
          />
          <p className="text-ink-500 text-sm sm:self-center">
            {members.data
              ? q
                ? `${rows.length} / ${all.length} 位`
                : `共 ${formatCount(all.length)} 位`
              : ""}
          </p>
          <Button
            variant="primary"
            onClick={download}
            loading={downloading}
            disabled={!members.data || all.length === 0}
          >
            <Download aria-hidden className="size-4" />
            下載 Excel
          </Button>
        </FilterBar>
      }
    >
      <DataTable
        caption={`${sig.name} 成員名單`}
        rows={rows}
        rowKey={(m) => m._id}
        rowLabel={(m) => m.name || "成員"}
        columns={columns}
        card={(m) => (
          <span className="flex items-center gap-3">
            <Avatar src={m.avatar} name={m.name} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink-900 text-sm">
                {m.name || "（未命名）"}
              </span>
              <span className="block truncate text-ink-500 text-xs">
                {[m.code, m.class, m.email].filter(Boolean).join(" · ") || "—"}
              </span>
            </span>
          </span>
        )}
        cardActions={removeButton}
        loading={members.isPending}
        fetching={members.isFetching && !members.isPending}
        error={members.isError ? errorText(members.error) : null}
        onRetry={() => members.refetch()}
        empty={q ? "沒有符合條件的成員" : "這個 SIG 還沒有成員"}
      />
    </ListCard>
  );
}

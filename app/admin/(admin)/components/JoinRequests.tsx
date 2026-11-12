"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { JOIN_QUESTIONS } from "@/app/[userID]/(User)/config/joinQuestions";
import { toast } from "@/components/mobile/Toast";
import { CustomStatus } from "@/modules/customStatusCode";
import {
  adminKeys,
  errorText,
  failureMessage,
  PAGE_SIZE,
  send,
  useInvalidate,
  useJoinRequests,
  usePatchList,
} from "../api";
import { formatDateTime, formatRelative } from "../format";
import type { JoinRequest, JoinState, JoinStatusFilter } from "../types";
import { oneOf, useQueryState } from "../useQueryState";
import { type Column, DataTable, Truncate } from "./DataTable";
import { Drawer } from "./Drawer";
import { FilterBar, type Option, SelectFilter } from "./Filters";
import { ListCard } from "./ListCard";
import { useConfirm } from "./Modal";
import { Pagination, pageCount } from "./Pagination";
import {
  Avatar,
  Badge,
  type BadgeTone,
  Button,
  InfoRow,
  linkClass,
} from "./ui";

// Join requests, decided in the panel instead of only through the email
// link (POST /admin/join-requests/:id/decision does the same as the link:
// accept adds the SIG, and the applicant gets the result email). Used by
// 入社申請 and by the 入社申請 tab of a SIG.

const STATUSES: readonly JoinStatusFilter[] = [
  "pending",
  "accepted",
  "rejected",
  "all",
];

const STATUS_OPTIONS: Option[] = [
  { value: "pending", label: "待審核" },
  { value: "accepted", label: "已同意" },
  { value: "rejected", label: "已拒絕" },
  { value: "all", label: "全部" },
];

const STATE_BADGE: Record<JoinState, { tone: BadgeTone; label: string }> = {
  pending: { tone: "warn", label: "待審核" },
  accepted: { tone: "ok", label: "已同意" },
  rejected: { tone: "mute", label: "已拒絕" },
};

export function JoinStateBadge({ state }: { state: JoinState }) {
  const badge = STATE_BADGE[state] ?? STATE_BADGE.pending;
  return <Badge tone={badge.tone}>{badge.label}</Badge>;
}

function applicant(request: JoinRequest) {
  return request.user?.name || "已刪除的使用者";
}

/**
 * The answers with their questions (contract v4 §5.6). Requests from
 * before custom questions have only q1..q3: the default questions.
 */
export function answersOf(request: JoinRequest) {
  const labelled = (request.answers ?? []).filter(
    (item) => item && typeof item.question === "string",
  );
  if (labelled.length > 0) {
    return labelled.map((item) => ({
      question: item.question || "（題目）",
      answer: typeof item.answer === "string" ? item.answer : "",
    }));
  }
  const old = [request.q1, request.q2, request.q3];
  return JOIN_QUESTIONS.map((question, index) => ({
    question: question.label,
    answer: old[index] ?? "",
  }));
}

function useJoinDecision() {
  const invalidate = useInvalidate();
  const patch = usePatchList<JoinRequest>(adminKeys.joinRequests);
  const confirm = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);

  const decide = async (request: JoinRequest, accept: boolean) => {
    if (!accept) {
      const ok = await confirm({
        title: `拒絕 ${applicant(request)} 的申請？`,
        description: `對方會收到「未通過」的通知信，之後可以再申請加入 ${request.sig?.name ?? "這個 SIG"}。`,
        confirmLabel: "拒絕申請",
        tone: "danger",
      });
      if (!ok) {
        return null;
      }
    }
    setBusy(request._id);
    const result = await send<{ state?: JoinState; updatedAt?: string }>(
      `/admin/join-requests/${request._id}/decision`,
      { body: { accept } },
    );
    setBusy(null);
    const refresh = () =>
      invalidate(
        adminKeys.joinRequests,
        adminKeys.sigs,
        adminKeys.overview,
        adminKeys.sigMembers(request.sig?._id ?? ""),
      );
    if (!result.ok) {
      if (result.status === CustomStatus.ALREADY_CONFIRMED) {
        toast.error("這筆申請已經有人處理過了，已重新整理");
        await refresh();
        return null;
      }
      toast.error(failureMessage(result));
      return null;
    }
    const state: JoinState =
      result.data?.state ?? (accept ? "accepted" : "rejected");
    const updatedAt = result.data?.updatedAt ?? new Date().toISOString();
    patch(request._id, { state, updatedAt });
    toast.success(
      accept
        ? `已同意 ${applicant(request)} 加入 ${request.sig?.name ?? "SIG"}`
        : `已拒絕 ${applicant(request)} 的申請`,
    );
    await refresh();
    return { state, updatedAt };
  };

  return { decide, busy };
}

export function JoinRequestList({
  fixedSig,
  sigOptions,
}: {
  /** Inside a SIG page: only this SIG, and no SIG column. */
  fixedSig?: string;
  /** The SIG filter on the 入社申請 page. */
  sigOptions?: Option[];
}) {
  const { get, set, page } = useQueryState();
  const sig = fixedSig ?? get("sig");
  const status = oneOf(get("status"), STATUSES, "pending");
  const requests = useJoinRequests({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    sig: sig || undefined,
    status,
  });
  const { decide, busy } = useJoinDecision();
  const [open, setOpen] = useState<JoinRequest | null>(null);

  const items = requests.data?.items ?? [];
  const total = requests.data?.total ?? 0;
  const pages = pageCount(total, PAGE_SIZE);

  useEffect(() => {
    if (requests.isSuccess && !requests.isPlaceholderData && page > pages) {
      set({ page: pages > 1 ? pages : null }, { replace: true });
    }
  }, [requests.isSuccess, requests.isPlaceholderData, page, pages]);

  const current = useMemo(
    () => (open ? (items.find((r) => r._id === open._id) ?? open) : null),
    [open, items],
  );

  const onDecide = async (request: JoinRequest, accept: boolean) => {
    const decided = await decide(request, accept);
    if (decided) {
      setOpen((prev) =>
        prev && prev._id === request._id ? { ...prev, ...decided } : prev,
      );
    }
  };

  const actions = (request: JoinRequest, size: "sm" | "md" = "sm") =>
    request.state === "pending" ? (
      <>
        <Button
          size={size}
          variant="primary"
          onClick={() => onDecide(request, true)}
          loading={busy === request._id}
          aria-label={`同意 ${applicant(request)} 加入`}
        >
          <Check aria-hidden className="size-3.5" />
          同意
        </Button>
        <Button
          size={size}
          onClick={() => onDecide(request, false)}
          disabled={busy === request._id}
          aria-label={`拒絕 ${applicant(request)} 的申請`}
        >
          <X aria-hidden className="size-3.5" />
          拒絕
        </Button>
      </>
    ) : null;

  const columns: Column<JoinRequest>[] = [
    {
      key: "user",
      header: "申請人",
      primary: true,
      cell: (request) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar
            src={request.user?.avatar}
            name={request.user?.name}
            size={28}
          />
          <span className="min-w-0">
            <Truncate className="font-medium text-ink-900">
              {applicant(request)}
            </Truncate>
            <Truncate className="text-ink-500 text-xs">
              {[
                request.user?.class,
                request.user?.customId && `@${request.user.customId}`,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </Truncate>
          </span>
        </span>
      ),
    },
    ...(fixedSig
      ? []
      : [
          {
            key: "sig",
            header: "SIG",
            className: "w-[20%]",
            cell: (request: JoinRequest) => (
              <Truncate>{request.sig?.name ?? "—"}</Truncate>
            ),
          },
        ]),
    {
      key: "answer",
      optional: true,
      header: "回答",
      className: "w-[26%]",
      cell: (request) => {
        const first = answersOf(request).find((item) => item.answer);
        return first ? (
          <Truncate className="text-ink-500">
            {`${first.question}：${first.answer}`}
          </Truncate>
        ) : (
          <span className="text-ink-400">—</span>
        );
      },
    },
    {
      key: "date",
      header: "申請時間",
      className: "w-[6.5rem]",
      cell: (request) => (
        <span
          className="whitespace-nowrap"
          title={formatDateTime(request.createdAt)}
        >
          {formatRelative(request.createdAt)}
        </span>
      ),
    },
    {
      key: "state",
      header: status === "pending" ? "動作" : "狀態",
      className: status === "pending" ? "w-[10.5rem]" : "w-[6rem]",
      cell: (request) =>
        request.state === "pending" ? (
          <span className="flex gap-1.5">{actions(request)}</span>
        ) : (
          <JoinStateBadge state={request.state} />
        ),
    },
  ];

  const filtered = Boolean((!fixedSig && sig) || status !== "pending");

  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <ListCard
          toolbar={
            <FilterBar>
              {!fixedSig && sigOptions && (
                <SelectFilter
                  label="SIG"
                  value={sig}
                  options={sigOptions}
                  onChange={(next) => set({ sig: next })}
                  className="sm:w-52"
                />
              )}
              <SelectFilter
                label="狀態"
                value={status}
                options={STATUS_OPTIONS}
                onChange={(next) =>
                  set({ status: next === "pending" ? null : next })
                }
                className="sm:w-36"
              />
              <p className="text-ink-500 text-xs sm:ml-auto sm:self-center">
                {status === "pending"
                  ? "最早送出的排在最前面"
                  : "最新的排在最前面"}
              </p>
            </FilterBar>
          }
          footer={
            <div className="sm:ml-auto">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                unit="筆"
                onPage={(next) => set({ page: next > 1 ? next : null })}
                disabled={requests.isFetching}
              />
            </div>
          }
        >
          <DataTable
            caption="入社申請列表"
            rows={items}
            rowKey={(request) => request._id}
            rowLabel={(request) => `${applicant(request)} 的申請`}
            columns={columns}
            card={(request) => (
              <span className="flex items-center gap-3">
                <Avatar
                  src={request.user?.avatar}
                  name={request.user?.name}
                  size={36}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-ink-900 text-sm">
                      {applicant(request)}
                    </span>
                    {request.state !== "pending" && (
                      <JoinStateBadge state={request.state} />
                    )}
                  </span>
                  <span className="block truncate text-ink-500 text-xs">
                    {fixedSig ? "" : `→ ${request.sig?.name ?? "SIG"} · `}
                    {formatRelative(request.createdAt)}
                    {request.user?.class ? ` · ${request.user.class}` : ""}
                  </span>
                </span>
              </span>
            )}
            cardActions={(request) => actions(request, "md")}
            onOpen={(request) => setOpen(request)}
            activeKey={current?._id}
            compact={Boolean(current)}
            loading={requests.isPending}
            fetching={requests.isFetching && !requests.isPending}
            error={requests.isError ? errorText(requests.error) : null}
            onRetry={() => requests.refetch()}
            empty={filtered ? "沒有符合條件的申請" : "目前沒有待審的申請"}
          />
        </ListCard>
      </div>

      <Drawer
        open={Boolean(current)}
        onClose={() => setOpen(null)}
        title={current ? `${applicant(current)} 的入社申請` : ""}
        subtitle={
          current && (
            <>
              {current.sig?.name ?? "SIG"} · {formatDateTime(current.createdAt)}
            </>
          )
        }
        footer={current ? actions(current) : undefined}
      >
        {current && <JoinRequestDetail request={current} />}
      </Drawer>
    </div>
  );
}

function JoinRequestDetail({ request }: { request: JoinRequest }) {
  const answers = answersOf(request);
  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <JoinStateBadge state={request.state} />
        {request.state !== "pending" && (
          <span className="text-ink-500 text-xs">
            {formatDateTime(request.updatedAt)} 處理
          </span>
        )}
      </div>
      {request.note && (
        <p className="mb-3 rounded-control bg-field px-3 py-2 text-ink-700 text-sm">
          {request.note}
        </p>
      )}
      <div className="flex flex-col gap-3">
        {answers.map((item, index) => (
          <Answer key={`${index}-${item.question}`} label={item.question}>
            {item.answer || "（未填寫）"}
          </Answer>
        ))}
      </div>
      <dl className="mt-3 border-line border-t pt-2">
        <InfoRow label="申請人">
          {request.user?.customId ? (
            <Link
              href={`/@${request.user.customId}`}
              target="_blank"
              className={linkClass}
            >
              {applicant(request)} @{request.user.customId}
            </Link>
          ) : (
            applicant(request)
          )}
        </InfoRow>
        <InfoRow label="班級">{request.user?.class || "—"}</InfoRow>
        <InfoRow label="SIG">
          {request.sig ? (
            <Link href={`/admin/sigs/${request.sig._id}`} className={linkClass}>
              {request.sig.name}
            </Link>
          ) : (
            "—"
          )}
        </InfoRow>
      </dl>
    </>
  );
}

function Answer({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-semibold text-ink-500 text-xs">{label}</p>
      <p className="whitespace-pre-wrap break-words rounded-control bg-field px-3 py-2 text-ink-800 text-sm leading-relaxed">
        {children}
      </p>
    </div>
  );
}

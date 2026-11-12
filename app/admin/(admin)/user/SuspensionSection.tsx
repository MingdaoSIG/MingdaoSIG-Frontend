"use client";

import { MicOff, ShieldBan, ShieldCheck } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import type { ApiFailure } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import {
  activeSuspension,
  formatSuspensionUntil,
  SUSPENSION_LABEL,
  SUSPENSION_REASON_MAX,
  type Suspension,
  type SuspensionType,
} from "@/modules/suspension";
import {
  adminKeys,
  backendMessage,
  errorText,
  failureMessage,
  isChinese,
  isForbidden,
  useInvalidate,
} from "../api";
import { Modal, useConfirm } from "../components/Modal";
import {
  Badge,
  Button,
  Field,
  inputClass,
  Spinner,
  textareaClass,
} from "../components/ui";
import { useAdmin } from "../context";
import { formatDateTime, formatRelative, toDateInput } from "../format";
import {
  moderationKeys,
  roleOf,
  suspendUser,
  unsuspendUser,
  useSuspensionHistory,
} from "../moderationApi";
import type { AdminUserDetail, AuditEntry } from "../types";

// 停權／禁言 in the user drawer (contract v4 §5.1).
// - 禁言 (mute): no posting, comments, likes, join requests, RSVPs or
//   teacher feedback; reading, reporting, bookmarks and drafts still work.
// - 停權 (ban): no login at all.
// Admins may do both; content moderators only mute (and lift mutes).
// Nobody may suspend themself or an admin, and content moderators may not
// suspend each other. The history comes from the audit log, which only
// admins can read.

const EFFECT: Record<SuspensionType, string> = {
  mute: "不能發文、編輯貼文、留言、按讚、申請加入 SIG、報名活動或給老師回饋；仍然可以閱讀、檢舉、收藏與寫草稿。",
  ban: "不能登入，所有需要登入的功能都無法使用。",
};

const DURATIONS = [
  { id: "1d", label: "1 天", days: 1 },
  { id: "3d", label: "3 天", days: 3 },
  { id: "7d", label: "7 天", days: 7 },
  { id: "30d", label: "30 天", days: 30 },
  { id: "forever", label: "無限期", days: null },
  { id: "custom", label: "自訂", days: null },
] as const;
type DurationId = (typeof DURATIONS)[number]["id"];

/** Why this caller may not suspend this user at all, or "". */
export function suspensionBlocked(
  user: AdminUserDetail,
  caller: { isAdmin: boolean; userId: string },
) {
  if (user._id === caller.userId) {
    return "不能停權或禁言自己。";
  }
  const role = roleOf(user);
  if (role === "admin") {
    return "管理員不能被停權或禁言。";
  }
  if (!caller.isAdmin && role === "moderator") {
    return "內容管理員不能停權或禁言其他內容管理員。";
  }
  return "";
}

/** The backend's 403/4001 and 400/4011, in Chinese. */
function suspendRefusal(failure: ApiFailure) {
  const message = backendMessage(failure);
  if (isForbidden(failure)) {
    if (message && isChinese(message)) {
      return message;
    }
    if (/own suspension|yourself/i.test(message)) {
      return "不能停權或禁言自己";
    }
    if (/admin cannot be suspended/i.test(message)) {
      return "管理員不能被停權或禁言";
    }
    if (/only mute/i.test(message)) {
      return "內容管理員只能禁言，不能停權";
    }
    if (/each other/i.test(message)) {
      return "內容管理員不能停權或禁言其他內容管理員";
    }
    if (/ban/i.test(message)) {
      return "停權只有管理員可以變更或解除";
    }
    if (/changed meanwhile/i.test(message)) {
      return "對方的狀態剛剛被變更了，請重新整理後再試";
    }
    return "你沒有權限變更這位使用者的停權狀態";
  }
  if (failure.status === CustomStatus.INVALID_BODY) {
    if (/until/i.test(message)) {
      return "結束時間必須是未來的時間";
    }
    if (/reason/i.test(message)) {
      return `請填寫原因（最多 ${SUSPENSION_REASON_MAX} 字）`;
    }
  }
  return failureMessage(failure);
}

export function SuspensionBadge({
  suspension,
}: {
  suspension: Suspension | null | undefined;
}) {
  const active = activeSuspension(suspension);
  if (!active) {
    return null;
  }
  return (
    <Badge tone={active.type === "ban" ? "danger" : "warn"}>
      {active.type === "ban" ? "停權中" : "禁言中"}
    </Badge>
  );
}

export function SuspensionSection({
  user,
  onChanged,
}: {
  user: AdminUserDetail;
  onChanged: (suspension: Suspension | null) => void;
}) {
  const admin = useAdmin();
  const confirm = useConfirm();
  const invalidate = useInvalidate();
  const [dialog, setDialog] = useState<SuspensionType | null>(null);
  const [busy, setBusy] = useState(false);
  const current = activeSuspension(user.suspension);
  const blocked = suspensionBlocked(user, admin);
  const history = useSuspensionHistory(user._id, admin.isAdmin);
  // Content moderators may not touch a ban.
  const banLocked = !admin.isAdmin && current?.type === "ban";

  const refresh = () =>
    invalidate(adminKeys.users, moderationKeys.suspensionHistory(user._id));

  const lift = async () => {
    if (!current) {
      return;
    }
    const label = SUSPENSION_LABEL[current.type];
    const ok = await confirm({
      title: `解除 ${user.name || "這位使用者"} 的${label}？`,
      description: `解除後對方會收到通知，可以立刻正常使用。`,
      confirmLabel: `解除${label}`,
    });
    if (!ok) {
      return;
    }
    setBusy(true);
    const result = await unsuspendUser(user._id);
    setBusy(false);
    if (!result.ok) {
      toast.error(suspendRefusal(result));
      return;
    }
    onChanged(null);
    toast.success(`已解除${label}`);
    await refresh();
  };

  return (
    <div>
      {current ? (
        <div
          className={`rounded-control border px-3 py-2 text-sm ${
            current.type === "ban"
              ? "border-danger-700/25 bg-danger-50"
              : "border-warm-600/25 bg-warm-50"
          }`}
        >
          <p
            className={`flex items-center gap-1.5 font-semibold ${
              current.type === "ban" ? "text-danger-700" : "text-warm-600"
            }`}
          >
            {current.type === "ban" ? (
              <ShieldBan aria-hidden className="size-4" />
            ) : (
              <MicOff aria-hidden className="size-4" />
            )}
            {current.type === "ban" ? "停權中" : "禁言中"}
            <span className="font-normal text-ink-700">
              {current.until
                ? `至 ${formatSuspensionUntil(current.until)}`
                : "（無限期）"}
            </span>
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-ink-800">
            原因：{current.reason || "未填寫"}
          </p>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-ink-700 text-sm">
          <ShieldCheck aria-hidden className="size-4 text-ok-700" />
          正常，沒有停權或禁言
        </p>
      )}

      {blocked ? (
        <p className="mt-2 text-ink-500 text-xs">{blocked}</p>
      ) : banLocked ? (
        <p className="mt-2 text-ink-500 text-xs">
          停權只有管理員可以變更或解除。
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setDialog("mute")}
            disabled={busy}
          >
            <MicOff aria-hidden className="size-3.5" />
            {current?.type === "mute" ? "調整禁言" : "禁言"}
          </Button>
          {admin.isAdmin && (
            <Button
              size="sm"
              variant="danger-outline"
              onClick={() => setDialog("ban")}
              disabled={busy}
            >
              <ShieldBan aria-hidden className="size-3.5" />
              {current?.type === "ban" ? "調整停權" : "停權"}
            </Button>
          )}
          {current && (
            <Button size="sm" onClick={lift} loading={busy}>
              解除{SUSPENSION_LABEL[current.type]}
            </Button>
          )}
        </div>
      )}

      {admin.isAdmin ? (
        <SuspensionHistory
          entries={history.data ?? []}
          loading={history.isPending}
          error={history.isError ? errorText(history.error) : ""}
          selfId={admin.userId}
        />
      ) : null}

      <SuspendDialog
        type={dialog}
        user={user}
        current={current}
        onClose={() => setDialog(null)}
        onDone={async (suspension) => {
          setDialog(null);
          onChanged(suspension);
          await refresh();
        }}
      />
    </div>
  );
}

function historyText(entry: AuditEntry) {
  const meta = entry.meta ?? {};
  const type =
    meta.type === "ban" ? "停權" : meta.type === "mute" ? "禁言" : "停權／禁言";
  if (entry.action === "user.unsuspend") {
    return { title: `解除${type}`, detail: "" };
  }
  const until =
    typeof meta.until === "string" ? formatSuspensionUntil(meta.until) : "";
  return {
    title: `${type}${until ? `至 ${until}` : "（無限期）"}`,
    detail: typeof meta.reason === "string" ? meta.reason : "",
  };
}

function SuspensionHistory({
  entries,
  loading,
  error,
  selfId,
}: {
  entries: AuditEntry[];
  loading: boolean;
  error: string;
  selfId: string;
}) {
  return (
    <div className="mt-3">
      <h4 className="mb-1 font-semibold text-ink-500 text-xs">紀錄</h4>
      {loading ? (
        <Spinner />
      ) : error ? (
        <p role="alert" className="text-danger-700 text-xs">
          紀錄載入失敗：{error}
        </p>
      ) : entries.length === 0 ? (
        <p className="text-ink-500 text-xs">沒有停權或禁言紀錄</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {entries.map((entry) => {
            const text = historyText(entry);
            const actor =
              entry.actor?._id === selfId
                ? "你"
                : entry.actor?.name || "管理員";
            return (
              <li
                key={entry._id}
                className="border-line border-l-2 pl-2.5 text-xs"
              >
                <p className="text-ink-800">
                  <span className="font-semibold">{text.title}</span>
                  <span className="text-ink-500">
                    {" "}
                    · {actor} ·{" "}
                    <time
                      dateTime={entry.createdAt}
                      title={formatDateTime(entry.createdAt)}
                    >
                      {formatRelative(entry.createdAt)}
                    </time>
                  </span>
                </p>
                {text.detail && (
                  <p className="mt-0.5 break-words text-ink-500">
                    原因：{text.detail}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** datetime-local value for a date (local time). */
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function SuspendDialog({
  type,
  user,
  current,
  onClose,
  onDone,
}: {
  type: SuspensionType | null;
  user: AdminUserDetail;
  current: Suspension | null;
  onClose: () => void;
  onDone: (suspension: Suspension) => void;
}) {
  const [duration, setDuration] = useState<DurationId>("7d");
  const [custom, setCustom] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reasonId = useId();
  const customId = useId();
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const label = type ? SUSPENSION_LABEL[type] : "";

  useEffect(() => {
    if (!type) {
      return;
    }
    const adjusting = current?.type === type;
    setDuration(adjusting ? (current.until ? "custom" : "forever") : "7d");
    setCustom(
      adjusting && current.until
        ? toLocalInput(new Date(current.until))
        : toLocalInput(new Date(Date.now() + 7 * 86400000)),
    );
    setReason(adjusting ? current.reason : "");
    setError("");
  }, [type]);

  const until = (() => {
    const preset = DURATIONS.find((item) => item.id === duration);
    if (duration === "forever") {
      return null;
    }
    if (duration === "custom") {
      const date = new Date(custom);
      return Number.isNaN(date.getTime()) ? undefined : date;
    }
    return new Date(Date.now() + (preset?.days ?? 7) * 86400000);
  })();

  const submit = async () => {
    const text = reason.trim();
    if (!type) {
      return;
    }
    if (!text) {
      setError("請填寫原因，對方會在通知裡看到");
      reasonRef.current?.focus();
      return;
    }
    if (until === undefined || (until && until.getTime() <= Date.now())) {
      setError("結束時間必須是未來的時間");
      return;
    }
    setBusy(true);
    setError("");
    const body = {
      type,
      until: until ? until.toISOString() : null,
      reason: text,
    };
    const result = await suspendUser(user._id, body);
    setBusy(false);
    if (!result.ok) {
      setError(suspendRefusal(result));
      return;
    }
    const saved = activeSuspension(result.data?.suspension) ?? body;
    toast.success(`已${label} ${user.name || "這位使用者"}`);
    onDone(saved);
  };

  return (
    <Modal
      open={Boolean(type)}
      onClose={() => {
        if (!busy) {
          onClose();
        }
      }}
      title={`${label} ${user.name || "這位使用者"}`}
      description={type ? `${label}期間${EFFECT[type]}` : undefined}
      initialFocus={reasonRef}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button
            variant={type === "ban" ? "danger" : "primary"}
            loading={busy}
            onClick={submit}
          >
            確定{label}
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="mb-1 font-semibold text-ink-700 text-xs">
          期間
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map((item) => (
            <label
              key={item.id}
              className={`flex h-8 cursor-pointer items-center rounded-control border px-3 text-sm transition-colors ${
                duration === item.id
                  ? "border-brand-700 bg-brand-50 font-semibold text-brand-800"
                  : "border-line-strong bg-surface text-ink-700 hover:bg-field"
              }`}
            >
              <input
                type="radio"
                name="suspension-duration"
                value={item.id}
                checked={duration === item.id}
                onChange={() => setDuration(item.id)}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>
      {duration === "custom" && (
        <Field label="結束時間" htmlFor={customId} className="mt-3">
          <input
            id={customId}
            type="datetime-local"
            value={custom}
            min={toLocalInput(new Date())}
            onChange={(event) => setCustom(event.target.value)}
            className={inputClass}
          />
        </Field>
      )}
      <p className="mt-2 text-ink-500 text-xs">
        {until === null
          ? "沒有結束時間，直到有人解除為止。"
          : until
            ? `到 ${formatSuspensionUntil(until.toISOString())} 自動解除。`
            : "請選擇結束時間。"}
      </p>
      <Field
        label="原因"
        htmlFor={reasonId}
        className="mt-3"
        hint={
          <span className="flex justify-between gap-2">
            <span>對方會在通知與網站上方的提示看到</span>
            <span
              className={
                reason.length >= SUSPENSION_REASON_MAX
                  ? "text-warm-600"
                  : undefined
              }
            >
              {reason.length} / {SUSPENSION_REASON_MAX}
            </span>
          </span>
        }
      >
        <textarea
          ref={reasonRef}
          id={reasonId}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value.slice(0, SUSPENSION_REASON_MAX));
            setError("");
          }}
          maxLength={SUSPENSION_REASON_MAX}
          rows={3}
          disabled={busy}
          className={textareaClass}
        />
      </Field>
      {error && (
        <p role="alert" className="mt-2 text-danger-700 text-sm">
          {error}
        </p>
      )}
    </Modal>
  );
}

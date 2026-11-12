"use client";

import { Megaphone, Smartphone } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { NotificationItem } from "@/components/Notifications/NotificationItem";
import type { TNotification } from "@/interfaces/Notification";
import type { ApiFailure } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { SITE_URL } from "@/modules/site";
import { failureMessage, isForbidden, useInvalidate } from "../api";
import { useConfirm } from "../components/Modal";
import {
  Button,
  Field,
  inputClass,
  selectClass,
  textareaClass,
} from "../components/ui";
import { formatCount } from "../format";
import {
  BROADCAST_MESSAGE_MAX,
  BROADCAST_TITLE_MAX,
  BROADCASTS_PER_HOUR,
  type BroadcastInput,
  countRecipients,
  moderationKeys,
  sendBroadcast,
} from "../moderationApi";

// Writes a broadcast (廣播通知, contract v4 §5.5): a `system` notification
// to everyone (admins) or to one SIG's members, leaders and 指導老師
// (admins, and that SIG's managers), optionally pushed. Before sending it
// asks the backend how many people it reaches (`dryRun`) and confirms with
// that number. At most 5 broadcasts per sender per hour.

export type AudienceSig = {
  _id: string;
  name: string;
  /** For an estimate when the backend cannot count. */
  memberCount?: number;
  managers?: number;
};

/** A site link: a path, or a full address on this site turned into one. */
export function normalizeLink(value: string): string | null {
  const link = value.trim();
  if (!link) {
    return "";
  }
  if (link.startsWith("/") && !link.startsWith("//") && !/\s/.test(link)) {
    return link;
  }
  try {
    const url = new URL(link);
    const site = new URL(SITE_URL);
    if (url.hostname === site.hostname) {
      return `${url.pathname}${url.search}${url.hash}` || "/";
    }
  } catch {
    // Not a URL at all.
  }
  return null;
}

function broadcastRefusal(failure: ApiFailure) {
  if (
    failure.kind === "rate-limited" ||
    failure.status === CustomStatus.TOO_MANY_REQUESTS
  ) {
    return `一小時內最多只能傳送 ${BROADCASTS_PER_HOUR} 則廣播，請稍後再試`;
  }
  if (isForbidden(failure)) {
    return "你只能通知自己管理的 SIG 的成員";
  }
  if (failure.status === CustomStatus.INVALID_BODY) {
    return "標題、內容或連結的格式不正確，請檢查後再試";
  }
  if (failure.status === CustomStatus.NOT_FOUND) {
    return "找不到這個 SIG，請重新整理後再試";
  }
  return failureMessage(failure);
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={value > max ? "text-danger-700" : undefined}>
      {value} / {max}
    </span>
  );
}

export function BroadcastComposer({
  sigs,
  allowAll,
  fixedSig,
  estimateAll,
  onSent,
  stacked = false,
}: {
  /** SIGs the caller may notify (managers: their own). */
  sigs: AudienceSig[];
  /** Admins may send to everyone. */
  allowAll: boolean;
  /** The SIG detail's 「通知成員」: no audience picker. */
  fixedSig?: AudienceSig;
  /** Users on the platform, for an estimate of an 「全站」 broadcast. */
  estimateAll?: number;
  onSent?: (recipients: number) => void;
  /** One column (inside a dialog). */
  stacked?: boolean;
}) {
  const [audience, setAudience] = useState<"all" | "sig">(
    fixedSig || !allowAll ? "sig" : "all",
  );
  const [sigId, setSigId] = useState(fixedSig?._id ?? "");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [push, setPush] = useState(false);
  const [busy, setBusy] = useState<"count" | "send" | null>(null);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const confirm = useConfirm();
  const invalidate = useInvalidate();
  const titleRef = useRef<HTMLInputElement>(null);
  const ids = {
    sig: useId(),
    title: useId(),
    message: useId(),
    link: useId(),
  };

  const sig = fixedSig ?? sigs.find((item) => item._id === sigId) ?? null;
  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();
  const normalizedLink = normalizeLink(link);

  const problems = {
    sig: audience === "sig" && !sig ? "請選擇要通知的 SIG" : "",
    title: !trimmedTitle
      ? "請填寫標題"
      : trimmedTitle.length > BROADCAST_TITLE_MAX
        ? `標題最多 ${BROADCAST_TITLE_MAX} 字`
        : "",
    message: !trimmedMessage
      ? "請填寫內容"
      : trimmedMessage.length > BROADCAST_MESSAGE_MAX
        ? `內容最多 ${BROADCAST_MESSAGE_MAX} 字`
        : "",
    link:
      normalizedLink === null
        ? "請填寫站內路徑（以 / 開頭），例如 /post/…"
        : "",
  };
  const invalid = Object.values(problems).some(Boolean);

  const audienceLabel =
    audience === "all" ? "全站所有使用者" : `${sig?.name ?? "SIG"} 的成員`;

  const preview: TNotification = useMemo(
    () => ({
      _id: "preview",
      type: "system",
      actor: null,
      target: { kind: "broadcast", id: "preview", label: trimmedTitle },
      // No link, so the preview is a plain button and never navigates.
      link: "",
      meta: {
        title: trimmedTitle || "（標題）",
        message: trimmedMessage || "（內容）",
        audience:
          audience === "all"
            ? { type: "all" }
            : { type: "sig", sigName: sig?.name ?? "" },
      },
      read: false,
      createdAt: new Date().toISOString(),
    }),
    [trimmedTitle, trimmedMessage, audience, sig?.name],
  );

  const estimate =
    audience === "all"
      ? estimateAll
      : sig && typeof sig.memberCount === "number"
        ? sig.memberCount + (sig.managers ?? 0)
        : undefined;

  const submit = async () => {
    setTouched(true);
    setError("");
    if (invalid) {
      if (problems.title) {
        titleRef.current?.focus();
      }
      return;
    }
    const input: BroadcastInput = {
      audience:
        audience === "all"
          ? { type: "all" }
          : { type: "sig", sig: sig?._id ?? "" },
      title: trimmedTitle,
      message: trimmedMessage,
      ...(normalizedLink ? { link: normalizedLink } : {}),
      push,
    };

    setBusy("count");
    const counted = await countRecipients(input);
    setBusy(null);
    let countText: string;
    if (counted.ok) {
      if (counted.recipients === 0) {
        setError("這個對象目前沒有任何人可以通知");
        return;
      }
      countText = `${formatCount(counted.recipients)} 位`;
    } else if (
      counted.failure &&
      counted.failure.status !== CustomStatus.INVALID_BODY
    ) {
      // The backend refused the request itself (rights, rate…).
      setError(broadcastRefusal(counted.failure));
      return;
    } else {
      // The backend cannot count without sending: estimate.
      countText =
        typeof estimate === "number"
          ? `約 ${formatCount(estimate)} 位`
          : "所有符合的";
    }

    const ok = await confirm({
      title: `傳送給 ${countText}${audience === "all" ? "使用者" : "成員"}？`,
      description: (
        <span className="flex flex-col gap-1.5">
          <span>
            對象：{audienceLabel}（不含你自己）
            <br />
            標題：{trimmedTitle}
            <br />
            推播：{push ? "同時推播到手機與瀏覽器" : "只在通知中心顯示"}
          </span>
          <span className="text-ink-500 text-xs">
            傳送後不能收回。每小時最多傳送 {BROADCASTS_PER_HOUR} 則廣播。
          </span>
        </span>
      ),
      confirmLabel: `傳送給 ${countText}`,
    });
    if (!ok) {
      return;
    }

    setBusy("send");
    const result = await sendBroadcast(input);
    setBusy(null);
    if (!result.ok) {
      const text = broadcastRefusal(result);
      setError(text);
      toast.error(text);
      return;
    }
    const recipients =
      typeof result.data?.recipients === "number"
        ? result.data.recipients
        : counted.ok
          ? counted.recipients
          : 0;
    toast.success(`已傳送給 ${formatCount(recipients)} 位`);
    setTitle("");
    setMessage("");
    setLink("");
    setTouched(false);
    onSent?.(recipients);
    await invalidate(moderationKeys.broadcasts);
  };

  const show = (problem: string) => (touched ? problem : "");

  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)] gap-5 ${
        stacked ? "" : "xl:grid-cols-[minmax(0,1fr)_20rem]"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-3">
        {!fixedSig && (
          <fieldset>
            <legend className="mb-1 font-semibold text-ink-700 text-xs">
              對象
            </legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {allowAll && (
                <label className="flex cursor-pointer items-center gap-2 text-ink-800 text-sm">
                  <input
                    type="radio"
                    name="broadcast-audience"
                    checked={audience === "all"}
                    onChange={() => setAudience("all")}
                    className="size-4 cursor-pointer accent-brand-700"
                  />
                  全站所有使用者
                </label>
              )}
              <label className="flex cursor-pointer items-center gap-2 text-ink-800 text-sm">
                <input
                  type="radio"
                  name="broadcast-audience"
                  checked={audience === "sig"}
                  onChange={() => setAudience("sig")}
                  className="size-4 cursor-pointer accent-brand-700"
                />
                指定 SIG 的成員
              </label>
            </div>
            {audience === "sig" && (
              <div className="mt-2">
                <label htmlFor={ids.sig} className="sr-only">
                  SIG
                </label>
                <select
                  id={ids.sig}
                  value={sigId}
                  onChange={(event) => setSigId(event.target.value)}
                  className={`${selectClass} sm:max-w-xs`}
                  aria-invalid={Boolean(show(problems.sig)) || undefined}
                >
                  <option value="">選擇 SIG…</option>
                  {sigs.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {show(problems.sig) && (
                  <p className="mt-1 text-danger-700 text-xs">{problems.sig}</p>
                )}
                <p className="mt-1 text-ink-500 text-xs">
                  成員、幹部與指導老師都會收到。
                </p>
              </div>
            )}
          </fieldset>
        )}

        <Field
          label="標題"
          htmlFor={ids.title}
          hint={
            <span className="flex justify-between gap-2">
              <span className="text-danger-700">{show(problems.title)}</span>
              <Counter value={trimmedTitle.length} max={BROADCAST_TITLE_MAX} />
            </span>
          }
        >
          <input
            ref={titleRef}
            id={ids.title}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={BROADCAST_TITLE_MAX + 20}
            placeholder="例如：期末成果展報名開始"
            className={inputClass}
            aria-invalid={Boolean(show(problems.title)) || undefined}
          />
        </Field>
        <Field
          label="內容"
          htmlFor={ids.message}
          hint={
            <span className="flex justify-between gap-2">
              <span className="text-danger-700">{show(problems.message)}</span>
              <Counter
                value={trimmedMessage.length}
                max={BROADCAST_MESSAGE_MAX}
              />
            </span>
          }
        >
          <textarea
            id={ids.message}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={BROADCAST_MESSAGE_MAX + 50}
            rows={4}
            className={textareaClass}
            aria-invalid={Boolean(show(problems.message)) || undefined}
          />
        </Field>
        <Field
          label="連結（選填）"
          htmlFor={ids.link}
          hint={
            problems.link && link.trim() ? (
              <span className="text-danger-700">{problems.link}</span>
            ) : (
              "點通知時開啟的站內頁面；沒填就開啟通知中心。"
            )
          }
        >
          <input
            id={ids.link}
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="/post/… 或 /@sig"
            className={inputClass}
            aria-invalid={Boolean(problems.link) || undefined}
          />
        </Field>
        <label className="flex cursor-pointer items-start gap-2 text-ink-800 text-sm">
          <input
            type="checkbox"
            checked={push}
            onChange={(event) => setPush(event.target.checked)}
            className="mt-0.5 size-4 cursor-pointer accent-brand-700"
          />
          <span>
            同時推播到手機與瀏覽器
            <span className="block text-ink-500 text-xs">
              只會推給開啟推播、且沒有關閉「平台公告與 SIG 廣播」的人。
            </span>
          </span>
        </label>

        {error && (
          <p role="alert" className="text-danger-700 text-sm">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={submit}
            loading={busy !== null}
            disabled={touched && invalid}
          >
            <Megaphone aria-hidden className="size-4" />
            {busy === "count" ? "計算人數中…" : "傳送…"}
          </Button>
          <span className="text-ink-500 text-xs">
            傳送前會顯示收件人數，確認後才送出。
          </span>
        </div>
      </div>

      <aside aria-label="預覽" className="flex min-w-0 flex-col gap-3">
        <div>
          <p className="mb-1.5 font-semibold text-ink-700 text-xs">
            通知中心預覽
          </p>
          <ul className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <NotificationItem
              notification={preview}
              onOpen={() => undefined}
              compact
            />
          </ul>
        </div>
        {push && (
          <div>
            <p className="mb-1.5 font-semibold text-ink-700 text-xs">
              推播預覽
            </p>
            <div className="flex items-start gap-2.5 rounded-card border border-line bg-surface/80 p-3 shadow-card">
              <Smartphone
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-ink-500"
              />
              <div className="min-w-0 text-sm">
                <p className="truncate font-semibold text-ink-900">
                  {trimmedTitle || "（標題）"}
                </p>
                <p className="line-clamp-2 break-words text-ink-700">
                  {trimmedMessage || "（內容）"}
                </p>
              </div>
            </div>
          </div>
        )}
        <p className="text-ink-500 text-xs">
          收件對象：{audienceLabel}
          {typeof estimate === "number" && `（約 ${formatCount(estimate)} 位）`}
        </p>
      </aside>
    </div>
  );
}

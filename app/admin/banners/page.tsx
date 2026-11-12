"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { BannerBar } from "@/components/SiteBanner/BannerBar";
import { SITE_BANNER_QUERY_KEY } from "@/components/SiteBanner/SiteBanner";
import { CustomStatus } from "@/modules/customStatusCode";
import {
  BANNER_LEVELS,
  BANNER_MESSAGE_MAX,
  type BannerLevel,
  bannerLink,
} from "@/modules/siteBanner";
import {
  backendMessage,
  errorText,
  failureMessage,
  useInvalidate,
} from "../(admin)/api";
import { PageHeader } from "../(admin)/components/AdminShell";
import { Modal, useConfirm } from "../(admin)/components/Modal";
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  inputClass,
  SkeletonRows,
  textareaClass,
} from "../(admin)/components/ui";
import { formatDateTime, toDateInput } from "../(admin)/format";
import {
  type AdminBanner,
  type BannerInput,
  deleteBanner,
  moderationKeys,
  saveBanner,
  useBanners,
} from "../(admin)/moderationApi";

// 公告橫幅 (contract v4 §5.4): the slim message under the header on every
// page except /admin. The site shows the newest banner whose window
// includes now; each visitor can close a banner, which hides it for them.

type BannerState = "showing" | "covered" | "scheduled" | "ended";

const STATE_BADGE: Record<BannerState, { label: string; tone: BadgeTone }> = {
  showing: { label: "顯示中", tone: "ok" },
  covered: { label: "被較新的橫幅蓋過", tone: "mute" },
  scheduled: { label: "排程中", tone: "info" },
  ended: { label: "已結束", tone: "mute" },
};

function time(value: string | null | undefined) {
  if (!value) {
    return Number.NaN;
  }
  return new Date(value).getTime();
}

function isLive(banner: AdminBanner, now: number) {
  const start = time(banner.startAt);
  const end = time(banner.endAt);
  return (
    (Number.isNaN(start) || start <= now) && (Number.isNaN(end) || now < end)
  );
}

/** Each banner's state; only the newest live one is on the site. */
function bannerStates(banners: AdminBanner[], now: number) {
  const states = new Map<string, BannerState>();
  const live = banners
    .filter((banner) => !banner.removed && isLive(banner, now))
    .sort((a, b) => time(b.createdAt) - time(a.createdAt));
  for (const banner of banners) {
    if (isLive(banner, now)) {
      states.set(
        banner._id,
        banner._id === live[0]?._id ? "showing" : "covered",
      );
    } else if (time(banner.startAt) > now) {
      states.set(banner._id, "scheduled");
    } else {
      states.set(banner._id, "ended");
    }
  }
  return states;
}

const STATE_ORDER: BannerState[] = ["showing", "scheduled", "covered", "ended"];

/** datetime-local value (local time). */
function toLocalInput(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function AdminBannersPage() {
  const banners = useBanners();
  const [editing, setEditing] = useState<AdminBanner | "new" | null>(null);
  const confirm = useConfirm();
  const invalidate = useInvalidate();
  const now = Date.now();

  const items = banners.data?.items ?? [];
  const states = useMemo(() => bannerStates(items, now), [items, now]);
  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          STATE_ORDER.indexOf(states.get(a._id) ?? "ended") -
            STATE_ORDER.indexOf(states.get(b._id) ?? "ended") ||
          time(b.createdAt) - time(a.createdAt),
      ),
    [items, states],
  );

  const refresh = () =>
    invalidate(moderationKeys.banners, SITE_BANNER_QUERY_KEY);

  const remove = async (banner: AdminBanner) => {
    const ok = await confirm({
      title: "刪除這則橫幅？",
      description: `「${banner.message}」會立刻從網站上移除。`,
      confirmLabel: "刪除",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    const result = await deleteBanner(banner._id);
    if (!result.ok && result.status !== CustomStatus.NOT_FOUND) {
      toast.error(failureMessage(result));
      return;
    }
    toast.success("已刪除橫幅");
    await refresh();
  };

  return (
    <>
      <PageHeader
        title="公告橫幅"
        description="顯示在網站頁首下方（管理平台除外）；同一時間只顯示最新的一則，使用者可以自行關閉。"
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            <Plus aria-hidden className="size-4" />
            新增橫幅
          </Button>
        }
      />
      {banners.isPending ? (
        <Card padded={false}>
          <SkeletonRows rows={4} />
        </Card>
      ) : banners.isError ? (
        <Card>
          <ErrorState
            message={errorText(banners.error)}
            onRetry={() => banners.refetch()}
          />
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <EmptyState title="還沒有橫幅">
            用「新增橫幅」公告維護時間、活動或重要提醒。
          </EmptyState>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((banner) => {
            const state = STATE_BADGE[states.get(banner._id) ?? "ended"];
            const author =
              typeof banner.createdBy === "object"
                ? banner.createdBy?.name
                : "";
            return (
              <li
                key={banner._id}
                className="rounded-card border border-line bg-surface p-4 shadow-card"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone={state.tone}>{state.label}</Badge>
                  <span className="text-ink-500 text-xs">
                    {formatDateTime(banner.startAt)} →{" "}
                    {banner.endAt ? formatDateTime(banner.endAt) : "不限"}
                    {author ? ` · ${author}` : ""}
                  </span>
                  <span className="ml-auto flex gap-1.5">
                    <Button size="sm" onClick={() => setEditing(banner)}>
                      <Pencil aria-hidden className="size-3.5" />
                      編輯
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-outline"
                      onClick={() => remove(banner)}
                    >
                      <Trash2 aria-hidden className="size-3.5" />
                      刪除
                    </Button>
                  </span>
                </div>
                <BannerBar
                  tone={banner.level}
                  link={banner.link}
                  layout="inline"
                >
                  {banner.message}
                </BannerBar>
                {banner.link && (
                  <p className="mt-1.5 truncate text-ink-500 text-xs">
                    連結：{banner.link}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <BannerDialog
        banner={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await refresh();
        }}
      />
    </>
  );
}

function BannerDialog({
  banner,
  onClose,
  onSaved,
}: {
  banner: AdminBanner | "new" | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const existing = banner && banner !== "new" ? banner : null;
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [level, setLevel] = useState<BannerLevel>("info");
  const [startAt, setStartAt] = useState("");
  const [hasEnd, setHasEnd] = useState(false);
  const [endAt, setEndAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const ids = {
    message: useId(),
    link: useId(),
    start: useId(),
    end: useId(),
  };

  useEffect(() => {
    if (!banner) {
      return;
    }
    const now = new Date();
    setMessage(existing?.message ?? "");
    setLink(existing?.link ?? "");
    setLevel(existing?.level ?? "info");
    setStartAt(toLocalInput(existing?.startAt ?? now));
    setHasEnd(Boolean(existing?.endAt));
    setEndAt(
      toLocalInput(existing?.endAt ?? new Date(now.getTime() + 7 * 86400000)),
    );
    setError("");
    setTouched(false);
  }, [banner]);

  const text = message.trim();
  const start = fromLocalInput(startAt);
  const end = hasEnd ? fromLocalInput(endAt) : null;
  const problems = {
    message: !text
      ? "請填寫公告內容"
      : text.length > BANNER_MESSAGE_MAX
        ? `最多 ${BANNER_MESSAGE_MAX} 字`
        : "",
    link:
      link.trim() && !bannerLink(link)
        ? "請填寫站內路徑（以 / 開頭）或 https:// 開頭的網址"
        : "",
    start: start ? "" : "請選擇開始時間",
    end: hasEnd
      ? !end
        ? "請選擇結束時間"
        : start && end <= start
          ? "結束時間要晚於開始時間"
          : end.getTime() <= Date.now()
            ? "結束時間已經過了，橫幅不會顯示"
            : ""
      : "",
  };
  const invalid = Object.values(problems).some(Boolean);
  const show = (problem: string) => (touched ? problem : "");

  const submit = async () => {
    setTouched(true);
    setError("");
    if (invalid || !start) {
      if (problems.message) {
        messageRef.current?.focus();
      }
      return;
    }
    const body: BannerInput = {
      message: text,
      link: link.trim(),
      level,
      startAt: start.toISOString(),
      endAt: end ? end.toISOString() : null,
    };
    setBusy(true);
    const result = await saveBanner(existing?._id ?? null, body);
    setBusy(false);
    if (!result.ok) {
      const detail = backendMessage(result);
      setError(
        result.status === CustomStatus.INVALID_BODY
          ? /endAt/i.test(detail)
            ? "結束時間要晚於開始時間"
            : /link/i.test(detail)
              ? "連結格式不正確：請用站內路徑或 https 網址"
              : "內容格式不正確，請檢查後再試"
          : failureMessage(result),
      );
      return;
    }
    toast.success(existing ? "已更新橫幅" : "已新增橫幅");
    onSaved();
  };

  return (
    <Modal
      open={Boolean(banner)}
      onClose={() => {
        if (!busy) {
          onClose();
        }
      }}
      title={existing ? "編輯橫幅" : "新增橫幅"}
      initialFocus={messageRef}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button variant="primary" loading={busy} onClick={submit}>
            {existing ? "儲存" : "新增"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="mb-1 font-semibold text-ink-700 text-xs">預覽</p>
          <BannerBar tone={level} link={link} layout="inline">
            {text || "公告內容"}
          </BannerBar>
        </div>
        <Field
          label="內容"
          htmlFor={ids.message}
          hint={
            <span className="flex justify-between gap-2">
              <span className="text-danger-700">{show(problems.message)}</span>
              <span
                className={
                  text.length > BANNER_MESSAGE_MAX
                    ? "text-danger-700"
                    : undefined
                }
              >
                {text.length} / {BANNER_MESSAGE_MAX}
              </span>
            </span>
          }
        >
          <textarea
            ref={messageRef}
            id={ids.message}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            maxLength={BANNER_MESSAGE_MAX + 20}
            className={textareaClass}
            aria-invalid={Boolean(show(problems.message)) || undefined}
          />
        </Field>
        <fieldset>
          <legend className="mb-1 font-semibold text-ink-700 text-xs">
            樣式
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {BANNER_LEVELS.map((item) => (
              <label
                key={item.id}
                className={`flex h-8 cursor-pointer items-center rounded-control border px-3 text-sm transition-colors ${
                  level === item.id
                    ? "border-brand-700 bg-brand-50 font-semibold text-brand-800"
                    : "border-line-strong bg-surface text-ink-700 hover:bg-field"
                }`}
              >
                <input
                  type="radio"
                  name="banner-level"
                  value={item.id}
                  checked={level === item.id}
                  onChange={() => setLevel(item.id)}
                  className="sr-only"
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field
          label="連結（選填）"
          htmlFor={ids.link}
          hint={
            problems.link ? (
              <span className="text-danger-700">{problems.link}</span>
            ) : (
              "站內路徑（例如 /post/…）在同一分頁開啟；https 網址在新分頁開啟。"
            )
          }
        >
          <input
            id={ids.link}
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="/post/… 或 https://…"
            className={inputClass}
            aria-invalid={Boolean(problems.link) || undefined}
          />
        </Field>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          <Field
            label="開始時間"
            htmlFor={ids.start}
            hint={
              show(problems.start) && (
                <span className="text-danger-700">{problems.start}</span>
              )
            }
          >
            <input
              id={ids.start}
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="flex cursor-pointer items-center gap-1.5 font-semibold text-ink-700 text-xs">
              <input
                type="checkbox"
                checked={hasEnd}
                onChange={(event) => setHasEnd(event.target.checked)}
                className="size-3.5 cursor-pointer accent-brand-700"
              />
              結束時間
            </label>
            <label htmlFor={ids.end} className="sr-only">
              結束時間
            </label>
            <input
              id={ids.end}
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
              disabled={!hasEnd}
              className={inputClass}
            />
            <span className="text-ink-500 text-xs">
              {hasEnd ? (
                problems.end ? (
                  <span className="text-danger-700">{problems.end}</span>
                ) : (
                  "到這個時間自動下架。"
                )
              ) : (
                "不設定就一直顯示，直到刪除。"
              )}
            </span>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-danger-700 text-sm">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

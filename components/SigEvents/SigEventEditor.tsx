"use client";

import { useEffect, useId, useState } from "react";
import { Modal } from "@/components/Modal";
import { SettingSwitch } from "@/components/Notifications/SettingSwitch";
import type { TSigEvent, TSigEventInput } from "@/interfaces/Engagement";
import {
  createSigEvent,
  EVENT_CAPACITY_MAX,
  EVENT_DESCRIPTION_MAX,
  EVENT_LOCATION_MAX,
  EVENT_TITLE_MAX,
  editSigEvent,
  eventFailureMessage,
  eventOf,
  fromLocalInput,
  toLocalInput,
} from "@/modules/sigEvents";

// 新增活動 / 編輯活動 for the SIG's managers (leaders, 指導老師) and
// admins. Used on the SIG page and in the admin SIG detail (活動 tab).
// Create sends every field; edit sends only what changed.

type Form = {
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  capacity: string;
  rsvpOpen: boolean;
};

type FieldErrors = Partial<Record<keyof Form, string>>;

const TWO_HOURS = 2 * 60 * 60 * 1000;

function formOf(event: TSigEvent | null | undefined): Form {
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    location: event?.location ?? "",
    startAt: toLocalInput(event?.startAt),
    endAt: toLocalInput(event?.endAt),
    capacity: String(event?.capacity ?? 0),
    rsvpOpen: event?.rsvpOpen ?? true,
  };
}

/** Code points, the way the backend counts. */
function length(value: string) {
  return Array.from(value.trim()).length;
}

function validate(form: Form): FieldErrors {
  const errors: FieldErrors = {};
  if (length(form.title) === 0) {
    errors.title = "請輸入活動名稱";
  } else if (length(form.title) > EVENT_TITLE_MAX) {
    errors.title = `活動名稱最多 ${EVENT_TITLE_MAX} 字`;
  }
  if (length(form.location) > EVENT_LOCATION_MAX) {
    errors.location = `地點最多 ${EVENT_LOCATION_MAX} 字`;
  }
  if (length(form.description) > EVENT_DESCRIPTION_MAX) {
    errors.description = `說明最多 ${EVENT_DESCRIPTION_MAX} 字`;
  }
  const start = fromLocalInput(form.startAt);
  const end = fromLocalInput(form.endAt);
  if (!start) {
    errors.startAt = "請選擇開始時間";
  }
  if (!end) {
    errors.endAt = "請選擇結束時間";
  }
  if (start && end && new Date(end).getTime() < new Date(start).getTime()) {
    errors.endAt = "結束時間不能早於開始時間";
  }
  const capacity = form.capacity.trim();
  if (
    !/^\d+$/.test(capacity) ||
    Number(capacity) < 0 ||
    Number(capacity) > EVENT_CAPACITY_MAX
  ) {
    errors.capacity = `名額請填 0 到 ${EVENT_CAPACITY_MAX} 的整數（0 代表不限）`;
  }
  return errors;
}

function inputOf(form: Form): TSigEventInput {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    location: form.location.trim(),
    startAt: fromLocalInput(form.startAt) ?? "",
    endAt: fromLocalInput(form.endAt) ?? "",
    capacity: Number(form.capacity.trim()),
    rsvpOpen: form.rsvpOpen,
  };
}

/** The fields of `next` that differ from the saved event. */
function changesOf(next: TSigEventInput, saved: TSigEvent) {
  const patch: Partial<TSigEventInput> = {};
  if (next.title !== saved.title) {
    patch.title = next.title;
  }
  if (next.description !== (saved.description ?? "")) {
    patch.description = next.description;
  }
  if (next.location !== (saved.location ?? "")) {
    patch.location = next.location;
  }
  const sameTime = (a: string, b: string) =>
    new Date(a).getTime() === new Date(b).getTime();
  // datetime-local has minute precision: compare at the minute.
  if (!sameTime(next.startAt, toMinute(saved.startAt))) {
    patch.startAt = next.startAt;
  }
  if (!sameTime(next.endAt, toMinute(saved.endAt))) {
    patch.endAt = next.endAt;
  }
  if (next.capacity !== saved.capacity) {
    patch.capacity = next.capacity;
  }
  if (next.rsvpOpen !== saved.rsvpOpen) {
    patch.rsvpOpen = next.rsvpOpen;
  }
  return patch;
}

function toMinute(iso: string) {
  return fromLocalInput(toLocalInput(iso)) ?? iso;
}

const labelClass = "font-semibold text-ink-900 text-sm";
const fieldClass =
  "rounded-control border border-line-strong bg-surface px-3 text-[16px] text-ink-800 focus:border-brand-700/50 focus:outline-none focus:ring-2 focus:ring-brand-700/20 disabled:opacity-60 aria-[invalid=true]:border-danger-700 sm:text-[15px]";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="text-danger-700 text-xs">
      {message}
    </p>
  );
}

export function SigEventEditor({
  sigId,
  event,
  open,
  onClose,
  onSaved,
}: {
  sigId: string;
  /** The event to edit; null or absent creates a new one. */
  event?: TSigEvent | null;
  open: boolean;
  onClose: () => void;
  /** The event as the server saved it. */
  onSaved: (event: TSigEvent, created: boolean) => void;
}) {
  const [form, setForm] = useState<Form>(() => formOf(event));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const ids = {
    title: useId(),
    startAt: useId(),
    endAt: useId(),
    location: useId(),
    description: useId(),
    capacity: useId(),
  };

  // Start from the event as it is each time the dialog opens.
  useEffect(() => {
    if (open) {
      setForm(formOf(event));
      setErrors({});
      setSubmitted(false);
      setServerError(null);
      setSaving(false);
    }
  }, [open, event?._id]);

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    const next = { ...form, [key]: value };
    // A new start moves an empty or earlier end to two hours later.
    if (key === "startAt" && typeof value === "string" && value) {
      const start = new Date(value).getTime();
      const end = next.endAt ? new Date(next.endAt).getTime() : Number.NaN;
      if (Number.isNaN(end) || end < start) {
        next.endAt = toLocalInput(new Date(start + TWO_HOURS).toISOString());
      }
    }
    setForm(next);
    if (submitted) {
      setErrors(validate(next));
    }
  };

  async function save() {
    setSubmitted(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    const input = inputOf(form);
    const creating = !event;
    let body: Partial<TSigEventInput> = input;
    if (event) {
      body = changesOf(input, event);
      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }
    }
    setSaving(true);
    setServerError(null);
    const result = event
      ? await editSigEvent(event._id, body)
      : await createSigEvent(sigId, input);
    setSaving(false);
    if (!result.ok) {
      setServerError(eventFailureMessage(result, "save"));
      return;
    }
    const saved = eventOf(result.data);
    if (!saved) {
      setServerError("伺服器暫時無法回應，請稍後再試");
      return;
    }
    onSaved(saved, creating);
    onClose();
  }

  const describedBy = (key: keyof typeof ids) =>
    errors[key] ? `${ids[key]}-error` : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event ? "編輯活動" : "新增活動"}
      busy={saving}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 cursor-pointer rounded-control border border-line-strong bg-surface px-4 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="submit"
            form={`${ids.title}-form`}
            disabled={saving}
            className="h-10 cursor-pointer rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "儲存中…" : event ? "儲存" : "建立活動"}
          </button>
        </>
      }
    >
      <form
        id={`${ids.title}-form`}
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.title} className={labelClass}>
            活動名稱
          </label>
          <input
            id={ids.title}
            value={form.title}
            disabled={saving}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy("title")}
            onChange={(e) => update("title", e.target.value)}
            placeholder="例如：Arduino 入門社課"
            className={`${fieldClass} h-10 w-full`}
          />
          <div className="flex justify-between gap-2">
            <FieldError id={`${ids.title}-error`} message={errors.title} />
            <span className="ml-auto text-ink-500 text-xs tabular-nums">
              {length(form.title)}/{EVENT_TITLE_MAX}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={ids.startAt} className={labelClass}>
              開始時間
            </label>
            <input
              id={ids.startAt}
              type="datetime-local"
              value={form.startAt}
              disabled={saving}
              aria-invalid={Boolean(errors.startAt)}
              aria-describedby={describedBy("startAt")}
              onChange={(e) => update("startAt", e.target.value)}
              className={`${fieldClass} h-10 w-full`}
            />
            <FieldError id={`${ids.startAt}-error`} message={errors.startAt} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={ids.endAt} className={labelClass}>
              結束時間
            </label>
            <input
              id={ids.endAt}
              type="datetime-local"
              value={form.endAt}
              min={form.startAt || undefined}
              disabled={saving}
              aria-invalid={Boolean(errors.endAt)}
              aria-describedby={describedBy("endAt")}
              onChange={(e) => update("endAt", e.target.value)}
              className={`${fieldClass} h-10 w-full`}
            />
            <FieldError id={`${ids.endAt}-error`} message={errors.endAt} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.location} className={labelClass}>
            地點<span className="font-normal text-ink-500">（選填）</span>
          </label>
          <input
            id={ids.location}
            value={form.location}
            disabled={saving}
            aria-invalid={Boolean(errors.location)}
            aria-describedby={describedBy("location")}
            onChange={(e) => update("location", e.target.value)}
            placeholder="例如：E202 教室、線上（Google Meet）"
            className={`${fieldClass} h-10 w-full`}
          />
          <FieldError id={`${ids.location}-error`} message={errors.location} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.description} className={labelClass}>
            說明<span className="font-normal text-ink-500">（選填）</span>
          </label>
          <textarea
            id={ids.description}
            value={form.description}
            rows={4}
            disabled={saving}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy("description")}
            onChange={(e) => update("description", e.target.value)}
            placeholder="要準備什麼、活動內容、注意事項"
            className={`${fieldClass} w-full resize-none py-2 leading-[1.7]`}
          />
          <div className="flex justify-between gap-2">
            <FieldError
              id={`${ids.description}-error`}
              message={errors.description}
            />
            <span
              className={`ml-auto text-xs tabular-nums ${
                length(form.description) > EVENT_DESCRIPTION_MAX
                  ? "text-danger-700"
                  : "text-ink-500"
              }`}
            >
              {length(form.description)}/{EVENT_DESCRIPTION_MAX}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.capacity} className={labelClass}>
            名額
          </label>
          <div className="flex items-center gap-2">
            <input
              id={ids.capacity}
              type="number"
              inputMode="numeric"
              min={0}
              max={EVENT_CAPACITY_MAX}
              step={1}
              value={form.capacity}
              disabled={saving}
              aria-invalid={Boolean(errors.capacity)}
              aria-describedby={`${ids.capacity}-hint ${describedBy("capacity") ?? ""}`}
              onChange={(e) => update("capacity", e.target.value)}
              className={`${fieldClass} h-10 w-28 shrink-0`}
            />
            <span id={`${ids.capacity}-hint`} className="text-ink-500 text-sm">
              人（0 代表不限名額）
            </span>
          </div>
          <FieldError id={`${ids.capacity}-error`} message={errors.capacity} />
        </div>

        <SettingSwitch
          label="開放報名"
          hint={
            form.rsvpOpen
              ? "成員可以在活動頁按「報名」"
              : "關閉後不能再報名，已報名的人不受影響"
          }
          checked={form.rsvpOpen}
          onChange={(next) => update("rsvpOpen", next)}
        />

        {serverError && (
          <p
            role="alert"
            className="rounded-control bg-danger-700/8 px-3 py-2 text-danger-700 text-sm"
          >
            {serverError}
          </p>
        )}
      </form>
    </Modal>
  );
}

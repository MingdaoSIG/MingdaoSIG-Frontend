"use client";

import { CircleCheck, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { apiRequest } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { uploadImageId } from "@/modules/imageUploadAPI";
import {
  APP_VERSION,
  collectContext,
  formatViewport,
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABEL,
  ISSUE_DESCRIPTION_MAX,
  ISSUE_IMAGES_MAX,
  ISSUE_TITLE_MAX,
  type IssueCategory,
  type IssueContext,
  type IssueReport,
  normalizeIssueReport,
  sameSitePath,
  textLength,
} from "@/modules/issueReports";
import {
  filesProblem,
  imageFilesOf,
  ScreenshotPicker,
  type Shot,
} from "./ScreenshotPicker";

// The 問題回報 form (contract v4 §7). Errors show on 送出回報, under the
// field, and clear when that field changes; nothing hints while typing.

type Errors = {
  title?: string;
  description?: string;
  images?: string;
  form?: string;
};

export const RATE_LIMIT_TEXT = "一小時內最多回報 5 次，請稍後再試";

export const cardClass =
  "rounded-card border border-line bg-surface shadow-card";

const inputClass =
  "w-full rounded-control border bg-surface px-3 text-[16px] text-ink-800 leading-[1.6] transition-colors focus:outline-none focus:ring-2 sm:text-sm";

function fieldClass(invalid: boolean) {
  return invalid
    ? `${inputClass} border-danger-700 focus:border-danger-700 focus:ring-danger-700/20`
    : `${inputClass} border-line-strong focus:border-brand-700/50 focus:ring-brand-700/20`;
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) {
    return null;
  }
  return (
    <p id={id} className="text-danger-700 text-sm">
      {children}
    </p>
  );
}

let shotSeq = 0;

export function IssueReportForm({
  initialCategory,
  from,
  digest,
}: {
  initialCategory: IssueCategory;
  from: string | null;
  digest: string | null;
}) {
  const [category, setCategory] = useState<IssueCategory>(initialCategory);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [context, setContext] = useState<IssueContext | null>(null);
  const [sent, setSent] = useState<IssueReport | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const shotsRef = useRef<Shot[]>([]);
  shotsRef.current = shots;
  const ids = {
    category: useId(),
    title: useId(),
    titleError: useId(),
    description: useId(),
    descriptionError: useId(),
    count: useId(),
  };

  useEffect(() => {
    setContext(collectContext({ from, digest }));
  }, [from, digest]);

  // Object URLs of the previews are freed when the form goes away.
  useEffect(
    () => () => {
      for (const shot of shotsRef.current) {
        URL.revokeObjectURL(shot.preview);
      }
    },
    [],
  );

  const uploading = shots.some((shot) => !shot.id);

  function clearError(key: keyof Errors) {
    setErrors((current) =>
      current[key] || current.form
        ? { ...current, [key]: undefined, form: undefined }
        : current,
    );
  }

  function addFiles(files: File[]) {
    if (sending || sent) {
      return;
    }
    const room = ISSUE_IMAGES_MAX - shotsRef.current.length;
    const problem = filesProblem(files, room);
    const usable = files
      .filter((file) => !filesProblem([file], 1))
      .slice(0, Math.max(0, room));
    setErrors((current) => ({ ...current, images: problem ?? undefined }));
    for (const file of usable) {
      shotSeq += 1;
      const shot: Shot = {
        key: `shot-${shotSeq}`,
        preview: URL.createObjectURL(file),
        id: null,
      };
      setShots((current) => [...current, shot]);
      void uploadImageId(file).then((result) => {
        if (!shotsRef.current.some((item) => item.key === shot.key)) {
          return;
        }
        if (result.ok) {
          setShots((current) =>
            current.map((item) =>
              item.key === shot.key ? { ...item, id: result.id } : item,
            ),
          );
          return;
        }
        URL.revokeObjectURL(shot.preview);
        setShots((current) => current.filter((item) => item.key !== shot.key));
        setErrors((current) => ({
          ...current,
          images: `截圖沒有上傳成功：${result.message}`,
        }));
      });
    }
  }

  function removeShot(key: string) {
    const shot = shotsRef.current.find((item) => item.key === key);
    if (shot) {
      URL.revokeObjectURL(shot.preview);
    }
    setShots((current) => current.filter((item) => item.key !== key));
    clearError("images");
  }

  function validate(): Errors {
    const next: Errors = {};
    const titleLength = textLength(title.trim());
    if (titleLength === 0) {
      next.title = "請填寫標題";
    } else if (titleLength > ISSUE_TITLE_MAX) {
      next.title = `標題最多 ${ISSUE_TITLE_MAX} 字`;
    }
    const descriptionLength = textLength(description.trim());
    if (descriptionLength === 0) {
      next.description = "請填寫說明";
    } else if (descriptionLength > ISSUE_DESCRIPTION_MAX) {
      next.description = `說明最多 ${ISSUE_DESCRIPTION_MAX} 字`;
    }
    return next;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending || uploading) {
      return;
    }
    const found = validate();
    setErrors(found);
    if (found.title) {
      titleRef.current?.focus();
      return;
    }
    if (found.description) {
      descriptionRef.current?.focus();
      return;
    }

    setSending(true);
    const result = await apiRequest<unknown>("/issue-report", {
      method: "POST",
      auth: true,
      body: {
        category,
        title: title.trim(),
        description: description.trim(),
        images: shots.flatMap((shot) => (shot.id ? [shot.id] : [])),
        context: context ?? collectContext({ from, digest }),
      },
    });
    setSending(false);

    if (result.ok) {
      setSent(
        normalizeIssueReport(result.data) ?? {
          _id: "",
          category,
          title: title.trim(),
          description: description.trim(),
          images: [],
          context: context ?? collectContext({ from, digest }),
          status: "open",
          reply: "",
          repliedAt: null,
          createdAt: null,
          updatedAt: null,
        },
      );
      window.scrollTo({ top: 0 });
      return;
    }
    let message: string;
    if (result.kind === "rate-limited") {
      message = RATE_LIMIT_TEXT;
    } else if (result.kind === "suspended") {
      // The existing suspension notice (modules/suspension).
      message = result.message;
    } else if (result.status === CustomStatus.INVALID_IMAGE_ID) {
      message = "有截圖無法使用，請移除後重新加入";
    } else if (result.kind === "unauthorized") {
      message = "登入已過期，請重新登入後再送出";
    } else {
      message = `沒有送出：${result.message}`;
    }
    setErrors({ form: message });
  }

  if (sent) {
    return <SentCard report={sent} from={from} />;
  }

  const descriptionLength = textLength(description);

  return (
    <form
      ref={formRef}
      aria-label="回報問題"
      noValidate
      onSubmit={submit}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (!formRef.current?.contains(event.relatedTarget as Node | null)) {
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        const files = imageFilesOf(event.dataTransfer.files);
        setDragging(false);
        if (event.dataTransfer.files.length > 0) {
          event.preventDefault();
        }
        if (files.length > 0) {
          addFiles(files);
        } else if (event.dataTransfer.files.length > 0) {
          setErrors((current) => ({
            ...current,
            images: "只接受 JPG、PNG、WebP 或 TIFF 圖片",
          }));
        }
      }}
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start"
    >
      <section
        aria-label="回報內容"
        className={`${cardClass} flex flex-col gap-5 p-4 transition-shadow lg:p-6 ${
          dragging ? "ring-2 ring-brand-700/40" : ""
        }`}
      >
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend
            id={ids.category}
            className="mb-2 p-0 font-semibold text-ink-900 text-sm"
          >
            類型
          </legend>
          <div className="flex flex-wrap gap-2">
            {ISSUE_CATEGORIES.map((value) => (
              <label
                key={value}
                className={`relative flex h-9 cursor-pointer items-center rounded-full border px-4 font-medium text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-700/40 ${
                  category === value
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-line-strong bg-surface text-ink-700 hover:bg-field"
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={value}
                  checked={category === value}
                  onChange={() => setCategory(value)}
                  className="sr-only"
                />
                {ISSUE_CATEGORY_LABEL[value]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={ids.title}
            className="font-semibold text-ink-900 text-sm"
          >
            標題
          </label>
          <input
            ref={titleRef}
            id={ids.title}
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              clearError("title");
            }}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? ids.titleError : undefined}
            className={`${fieldClass(Boolean(errors.title))} h-11`}
          />
          <FieldError id={ids.titleError}>{errors.title}</FieldError>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={ids.description}
            className="font-semibold text-ink-900 text-sm"
          >
            說明
          </label>
          <textarea
            ref={descriptionRef}
            id={ids.description}
            value={description}
            rows={8}
            onChange={(event) => {
              setDescription(event.target.value);
              clearError("description");
            }}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description
                ? `${ids.descriptionError} ${ids.count}`
                : ids.count
            }
            className={`${fieldClass(Boolean(errors.description))} min-h-40 resize-y py-2`}
          />
          <div className="flex items-start justify-between gap-3">
            <FieldError id={ids.descriptionError}>
              {errors.description}
            </FieldError>
            <span
              id={ids.count}
              className={`ml-auto shrink-0 text-xs tabular-nums ${
                descriptionLength > ISSUE_DESCRIPTION_MAX
                  ? "text-danger-700"
                  : "text-ink-500"
              }`}
            >
              {descriptionLength} / {ISSUE_DESCRIPTION_MAX}
            </span>
          </div>
        </div>

        <ScreenshotPicker
          shots={shots}
          error={errors.images ?? null}
          disabled={sending}
          onAdd={addFiles}
          onRemove={removeShot}
        />
      </section>

      <div className="flex flex-col gap-4 lg:sticky lg:top-[var(--shell-top)]">
        <ContextBox context={context} />
        <div className={`${cardClass} flex flex-col gap-3 p-4`}>
          {errors.form && (
            <p role="alert" className="text-danger-700 text-sm leading-6">
              {errors.form}
            </p>
          )}
          <button
            type="submit"
            disabled={sending || uploading}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send aria-hidden className="size-4" />
            {sending ? "送出中…" : uploading ? "截圖上傳中…" : "送出回報"}
          </button>
          <p className="text-ink-500 text-xs leading-5">
            管理員回覆或處理完成時，你會收到通知。
          </p>
        </div>
      </div>
    </form>
  );
}

function ContextRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-ink-500 text-xs">{label}</dt>
      <dd className="min-w-0 break-all text-ink-800 text-sm">{children}</dd>
    </div>
  );
}

const none = <span className="text-ink-400">（無）</span>;

/** 「會一起送出的資訊」: what goes in `context`, read-only. */
function ContextBox({ context }: { context: IssueContext | null }) {
  return (
    <section
      aria-labelledby="issue-context-title"
      className="rounded-card border border-line bg-field p-4"
    >
      <h2
        id="issue-context-title"
        className="mb-3 font-semibold text-ink-900 text-sm"
      >
        會一起送出的資訊
      </h2>
      <dl className="flex flex-col gap-2.5">
        <ContextRow label="目前頁面">{context?.pageUrl || none}</ContextRow>
        <ContextRow label="版本">
          v{context?.appVersion || APP_VERSION}
        </ContextRow>
        <ContextRow label="瀏覽器">
          <span className="text-xs leading-5">
            {context?.userAgent || none}
          </span>
        </ContextRow>
        <ContextRow label="螢幕大小">
          {context?.viewport ? formatViewport(context.viewport) : none}
        </ContextRow>
        {context?.errorDigest && (
          <ContextRow label="錯誤代碼">{context.errorDigest}</ContextRow>
        )}
      </dl>
    </section>
  );
}

function SentCard({
  report,
  from,
}: {
  report: IssueReport;
  from: string | null;
}) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function back() {
    const path = sameSitePath(from, window.location.origin);
    if (path) {
      router.push(path);
      return;
    }
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  const mine = report._id
    ? `/me/reports?id=${encodeURIComponent(report._id)}`
    : "/me/reports";

  return (
    <section
      className={`${cardClass} mx-auto flex w-full max-w-xl flex-col items-center gap-3 px-6 py-10 text-center`}
    >
      <CircleCheck aria-hidden className="size-10 text-ok-700" />
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-bold text-ink-900 text-xl focus:outline-none"
      >
        已送出回報
      </h2>
      <p className="max-w-lg break-words text-ink-700 text-sm leading-6">
        謝謝你回報「{report.title}」。管理員回覆或處理完成時，你會收到通知。
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={mine}
          className="flex h-10 items-center rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
        >
          查看我的回報
        </Link>
        <button
          type="button"
          onClick={back}
          className="h-10 cursor-pointer rounded-control border border-line-strong bg-surface px-5 font-semibold text-ink-700 text-sm transition-colors hover:bg-field"
        >
          回到上一頁
        </button>
      </div>
    </section>
  );
}

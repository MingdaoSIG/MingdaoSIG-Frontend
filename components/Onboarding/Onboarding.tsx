"use client";

import { Bell, Check, Sparkles, Users, X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PushControl } from "@/components/Notifications/PushControl";
import { apiRequest } from "@/modules/api/client";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import { ANNOUNCEMENT_SIG_ID, useSigDirectory } from "@/utils/useAdminAccess";
import { useFollowSig } from "@/utils/useFollowSig";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

// The three onboarding steps (v3 9B): ① pick SIGs of interest (追蹤, not
// 加入) ② turn on notifications (the push opt-in) ③ start. Skippable at
// any point; finishing or skipping sends `POST /user { onboarded: true }`
// so it never shows again.

type Step = 0 | 1 | 2;

const STEPS = ["追蹤 SIG", "通知", "開始"];

const primary =
  "inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-60";
const secondary =
  "inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-control px-4 font-semibold text-ink-500 text-sm transition-colors hover:bg-field hover:text-ink-800";

function StepDots({ step }: { step: Step }) {
  return (
    <ol className="flex items-center gap-2" aria-label="步驟">
      {STEPS.map((label, index) => (
        <li
          key={label}
          aria-current={index === step ? "step" : undefined}
          className="flex items-center gap-2"
        >
          <span
            className={`flex size-6 items-center justify-center rounded-full font-bold text-xs ${
              index < step
                ? "bg-ok-700 text-white"
                : index === step
                  ? "bg-brand-700 text-white"
                  : "bg-field text-ink-500"
            }`}
          >
            {index < step ? <Check size={13} aria-hidden /> : index + 1}
          </span>
          <span
            className={`text-xs ${
              index === step ? "font-semibold text-ink-900" : "text-ink-500"
            }`}
          >
            {label}
          </span>
          {index < STEPS.length - 1 && (
            <span aria-hidden className="h-px w-4 bg-line-strong" />
          )}
        </li>
      ))}
    </ol>
  );
}

function PickSigs({
  picked,
  onToggle,
}: {
  picked: Set<string>;
  onToggle: (sigId: string) => void;
}) {
  const { userData } = useUserAccount();
  const directory = useSigDirectory();
  const member = new Set(userData?.sig ?? []);
  const sigs = (directory.data ?? []).filter(
    (sig) => sig._id !== ANNOUNCEMENT_SIG_ID && sig.customId,
  );

  if (directory.isPending) {
    return (
      <div aria-hidden className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {["a", "b", "c", "d", "e", "f"].map((key) => (
          <div
            key={key}
            className="h-12 animate-pulse rounded-control bg-field"
          />
        ))}
      </div>
    );
  }
  if (directory.isError) {
    return (
      <p role="alert" className="text-ink-500 text-sm">
        SIG 列表載入失敗，可以先略過，之後在「探索」追蹤。
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {sigs.map((sig) => {
        const joined = member.has(sig._id);
        const on = joined || picked.has(sig._id);
        return (
          <li key={sig._id} className="min-w-0">
            <button
              type="button"
              aria-pressed={on}
              disabled={joined}
              title={sig.name}
              data-onboarding-sig={sig._id}
              onClick={() => onToggle(sig._id)}
              className={`flex h-full min-h-12 w-full cursor-pointer items-center gap-2 rounded-control border-[1.5px] px-3 py-2 text-left font-semibold text-sm transition-colors disabled:cursor-default ${
                on
                  ? "border-[var(--sig-color)] bg-[color-mix(in_srgb,var(--sig-color)_12%,white)] text-ink-900"
                  : "border-line-strong bg-surface text-ink-700 hover:bg-field"
              }`}
              style={{
                ["--sig-color" as string]: resolveSigColor(sig) ?? BRAND_COLOR,
              }}
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full bg-[var(--sig-color)]"
              />
              <span className="line-clamp-2 min-w-0 flex-1 [overflow-wrap:anywhere]">
                {sig.name}
              </span>
              {on && (
                <Check size={16} aria-hidden className="shrink-0 text-ok-700" />
              )}
              {joined && <span className="sr-only">（已加入）</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function Onboarding({ onClose }: { onClose: () => void }) {
  const isMobile = useIsMobile();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const { userData, updateUser } = useUserAccount();
  const follow = useFollowSig();
  const [step, setStep] = useState<Step>(0);
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(userData?.followedSigs ?? []),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followedCount, setFollowedCount] = useState(0);

  useEffect(() => {
    panelRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    panelRef.current
      ?.querySelector<HTMLElement>("[data-step-heading]")
      ?.focus({ preventScroll: true });
  }, [step]);

  /** Records that the onboarding is done (finished or skipped). */
  async function finish() {
    setBusy(true);
    const result = await apiRequest<{ onboardedAt?: string | null }>("/user", {
      method: "POST",
      body: { onboarded: true },
      auth: true,
    });
    setBusy(false);
    updateUser({
      onboardedAt:
        (result.ok && result.data?.onboardedAt) || new Date().toISOString(),
    });
    onClose();
  }

  async function followPicked() {
    const already = new Set(userData?.followedSigs ?? []);
    const toFollow = [...picked].filter((id) => !already.has(id));
    const toUnfollow = [...already].filter((id) => !picked.has(id));
    if (toFollow.length === 0 && toUnfollow.length === 0) {
      setFollowedCount(picked.size);
      setStep(1);
      return;
    }
    setBusy(true);
    setError(null);
    let failed = 0;
    for (const id of toFollow) {
      const result = await follow.toggle(id, true);
      if (!result.ok) {
        failed += 1;
      }
    }
    for (const id of toUnfollow) {
      const result = await follow.toggle(id, false);
      if (!result.ok) {
        failed += 1;
      }
    }
    setBusy(false);
    if (failed > 0) {
      setError(`有 ${failed} 個 SIG 沒有追蹤成功，請再試一次或先略過。`);
      return;
    }
    setFollowedCount(picked.size);
    setStep(1);
  }

  let body: ReactNode;
  let actions: ReactNode;
  if (step === 0) {
    body = (
      <>
        <p className="text-ink-700 text-sm">
          追蹤後，這些 SIG 的新貼文會出現在首頁的「我的
          SIG」。追蹤不是加入，隨時可以取消。
        </p>
        <PickSigs
          picked={picked}
          onToggle={(id) =>
            setPicked((old) => {
              const next = new Set(old);
              if (next.has(id)) {
                next.delete(id);
              } else {
                next.add(id);
              }
              return next;
            })
          }
        />
        {error && (
          <p role="alert" className="text-danger-700 text-sm">
            {error}
          </p>
        )}
      </>
    );
    actions = (
      <button
        type="button"
        className={primary}
        disabled={busy}
        onClick={() => void followPicked()}
      >
        {busy
          ? "追蹤中…"
          : picked.size > 0
            ? `追蹤 ${picked.size} 個 SIG`
            : "下一步"}
      </button>
    );
  } else if (step === 1) {
    body = (
      <>
        <p className="text-ink-700 text-sm">
          有人回覆你、你的 SIG 有新活動或申請結果出來時，手機或瀏覽器會通知你。
        </p>
        <div className="rounded-control border border-line p-4">
          <PushControl mobile={isMobile} />
        </div>
      </>
    );
    actions = (
      <button type="button" className={primary} onClick={() => setStep(2)}>
        下一步
      </button>
    );
  } else {
    body = (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Sparkles size={26} aria-hidden />
        </span>
        <p className="text-ink-700">
          {followedCount > 0
            ? `你追蹤了 ${followedCount} 個 SIG，首頁的「我的 SIG」會先顯示它們的新貼文。`
            : "到「探索」看看各個 SIG，找到有興趣的就追蹤。"}
        </p>
      </div>
    );
    actions = (
      <button
        type="button"
        className={primary}
        disabled={busy}
        onClick={() => void finish()}
      >
        {busy ? "請稍候…" : "開始使用"}
      </button>
    );
  }

  const headings = ["選擇你有興趣的 SIG", "開啟通知", "準備好了"];
  const icons = [Users, Bell, Sparkles];
  const Icon = icons[step];

  return createPortal(
    <div
      className={`fixed inset-0 z-[10000] flex bg-ink-900/40 ${
        isMobile ? "items-end" : "items-center justify-center p-6"
      }`}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-onboarding
        data-step={step}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !busy) {
            event.stopPropagation();
            void finish();
          }
        }}
        className={`flex flex-col bg-surface shadow-card-hover ${
          isMobile
            ? "max-h-[92dvh] w-full rounded-t-[16px] pb-[env(safe-area-inset-bottom)]"
            : "max-h-[min(44rem,calc(100dvh-3rem))] w-[min(40rem,100%)] rounded-card"
        }`}
      >
        <header className="flex shrink-0 items-start gap-3 border-line border-b px-5 pt-5 pb-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <StepDots step={step} />
            <h2
              id={titleId}
              data-step-heading
              tabIndex={-1}
              className="flex items-center gap-2 font-bold text-ink-900 text-xl"
            >
              <Icon size={20} aria-hidden className="text-brand-700" />
              {headings[step]}
            </h2>
          </div>
          <button
            type="button"
            aria-label="略過導覽"
            disabled={busy}
            onClick={() => void finish()}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-500 transition-colors hover:bg-field hover:text-ink-800"
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {body}
        </div>
        <footer className="flex shrink-0 items-center gap-2 border-line border-t px-5 py-3">
          {step < 2 && (
            <button
              type="button"
              className={secondary}
              disabled={busy}
              onClick={() => void finish()}
              data-onboarding-skip
            >
              略過
            </button>
          )}
          <span className="flex-1" />
          {step > 0 && step < 2 && (
            <button
              type="button"
              className={secondary}
              disabled={busy}
              onClick={() => setStep((step - 1) as Step)}
            >
              上一步
            </button>
          )}
          {actions}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

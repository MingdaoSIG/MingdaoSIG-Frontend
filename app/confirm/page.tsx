"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiRequest } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import BackToHome from "./Status/BackToHome/BackToHome";
import Success from "./Status/Success/Success";

type Decision = "accept" | "reject";

type Outcome =
  | { kind: "done"; decision: Decision }
  | { kind: "already" }
  | { kind: "failed"; message: string };

export default function ConfirmPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ConfirmContent />
    </Suspense>
  );
}

function Fallback() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-line-strong border-t-brand-700"></div>
      </div>
    </div>
  );
}

// Opening the email link only shows the request. Mail scanners follow
// links, so nothing is decided until a SIG leader presses a button, which
// sends POST /sig/confirm/:confirmId.
function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const confirmId = searchParams.get("confirmId");
  const accept = searchParams.get("accept");
  // The link the leader clicked (accept=true / false) is only a hint.
  const suggested: Decision | null =
    accept === "true" ? "accept" : accept === "false" ? "reject" : null;

  const [pending, setPending] = useState<Decision | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => {
    if (!isValidConfirmId(confirmId)) {
      router.replace("/");
    }
  }, [confirmId, router]);

  if (!isValidConfirmId(confirmId)) {
    return <Fallback />;
  }

  async function decide(decision: Decision) {
    if (pending || !isValidConfirmId(confirmId)) {
      return;
    }
    setPending(decision);
    const result = await apiRequest(`/sig/confirm/${confirmId}`, {
      method: "POST",
      body: { accept: decision === "accept" },
    });
    setPending(null);
    if (result.ok) {
      setOutcome({ kind: "done", decision });
    } else if (result.status === CustomStatus.ALREADY_CONFIRMED) {
      setOutcome({ kind: "already" });
    } else if (result.kind === "not-found") {
      setOutcome({ kind: "failed", message: "找不到這筆申請，可能已被取消" });
    } else {
      setOutcome({ kind: "failed", message: result.message });
    }
  }

  if (outcome?.kind === "done") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 p-4">
        <Success
          message={outcome.decision === "accept" ? "已同意申請" : "已拒絕申請"}
        />
        <BackToHome />
      </div>
    );
  }
  if (outcome?.kind === "already") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 p-4">
        <Success message="這筆申請已經審核過了" />
        <BackToHome />
      </div>
    );
  }

  const button =
    "inline-flex h-11 min-w-28 cursor-pointer items-center justify-center rounded-control px-5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-4">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 text-center shadow-card">
        <h1 className="mb-2 font-bold text-ink-900 text-xl">SIG 加入申請</h1>
        <p className="mb-1 text-ink-700 text-sm leading-6">
          申請內容已寄到你的信箱。請選擇是否同意這位同學加入 SIG。
        </p>
        <p className="mb-5 break-all text-ink-400 text-xs">
          申請編號：{confirmId}
        </p>
        {outcome?.kind === "failed" && (
          <p role="alert" className="mb-4 text-danger-700 text-sm">
            {outcome.message}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className={`${button} bg-brand-700 text-white hover:bg-brand-800 ${
              suggested === "accept"
                ? "ring-2 ring-brand-700/40 ring-offset-2"
                : ""
            }`}
            disabled={pending !== null}
            onClick={() => decide("accept")}
          >
            {pending === "accept" ? "處理中…" : "同意"}
          </button>
          <button
            type="button"
            className={`${button} border border-line text-ink-800 hover:bg-field ${
              suggested === "reject"
                ? "ring-2 ring-ink-400/40 ring-offset-2"
                : ""
            }`}
            disabled={pending !== null}
            onClick={() => decide("reject")}
          >
            {pending === "reject" ? "處理中…" : "拒絕"}
          </button>
        </div>
      </div>
      <BackToHome />
    </div>
  );
}

function isValidConfirmId(uuid: string | null): uuid is string {
  if (!uuid) {
    return false;
  }
  const uuidV4Regex =
    /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i;
  return uuidV4Regex.test(uuid);
}

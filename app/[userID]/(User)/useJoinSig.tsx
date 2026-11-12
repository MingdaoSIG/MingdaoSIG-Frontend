"use client";

import { useEffect, useState } from "react";
import ReactDOMServer from "react-dom/server";
import Swal from "sweetalert2";
import {
  JoinSigAPI,
  ReadJoinSigAPI,
} from "@/app/[userID]/(User)/apis/JoinSigAPI";
import { JOIN_QUESTIONS } from "@/app/[userID]/(User)/config/joinQuestions";
import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import type { ApiFailure } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { isSubmitEnter } from "@/utils/keyboard";
import { promptLogin } from "@/utils/loginPrompt";
import { useUserAccount } from "@/utils/useUserAccount";

/** Backend limit for each join-form answer. */
const JOIN_ANSWER_MAX = 250;

const QUESTIONS = JOIN_QUESTIONS;

const formHtml = ReactDOMServer.renderToString(
  <div style={{ textAlign: "left" }}>
    {QUESTIONS.map((q) => (
      <label key={q.id} htmlFor={q.id} style={{ display: "block" }}>
        <span style={{ display: "block", marginTop: "0.75rem" }}>
          {q.label}
        </span>
        <textarea
          id={q.id}
          className="swal2-textarea"
          style={{
            height: "5rem",
            width: "100%",
            margin: "0.25rem 0 0",
            padding: "0.25rem 0.4rem",
          }}
          maxLength={JOIN_ANSWER_MAX}
          placeholder={q.placeholder}
        />
      </label>
    ))}
  </div>,
);

function joinErrorMessage(result: ApiFailure) {
  switch (result.status) {
    case CustomStatus.ALREADY_JOINED:
      return "你已經是這個 SIG 的成員";
    case CustomStatus.ALREADY_APPLIED:
      return "你已經申請過了，請等待審核";
    case CustomStatus.INVALID_CONTENT_LENGTH:
      return `每題最多 ${JOIN_ANSWER_MAX} 字`;
    default:
      return result.message;
  }
}

/**
 * State and action of the 「加入 SIG」 button on a SIG page, shared by the
 * desktop and mobile profile cards. Logged-out visitors get an enabled
 * button that explains joining needs an account and offers to log in.
 */
export function useJoinSig(account: User | Sig | null, isSig: boolean) {
  const { token, userData, isLoading: authLoading, login } = useUserAccount();
  // "" = not known yet; "none" = no request, may apply.
  const [request, setRequest] = useState("");
  const sigId = isSig ? account?._id : undefined;

  useEffect(() => {
    if (!sigId || authLoading) {
      return;
    }
    if (!token) {
      setRequest("none");
      return;
    }
    const controller = new AbortController();
    (async () => {
      const response = await ReadJoinSigAPI(sigId, token, controller.signal);
      if (!controller.signal.aborted) {
        setRequest((response.ok && response.data?.state) || "none");
      }
    })();
    return () => controller.abort();
  }, [sigId, token, authLoading]);

  // Members added by a leader have no join request; their profile says so.
  const isMember = Boolean(sigId && token && userData?.sig?.includes(sigId));
  const state = isMember ? "accepted" : request;

  const label =
    state === "pending"
      ? "審核中"
      : state === "accepted"
        ? "已加入"
        : "加入 SIG";
  const disabled = state === "" || state === "pending" || state === "accepted";

  function join() {
    if (!sigId) {
      return;
    }
    if (!token) {
      promptLogin(login, { text: "登入後即可申請加入 SIG" });
      return;
    }
    const authToken = token;

    Swal.fire({
      title: "申請加入 SIG",
      html: formHtml,
      confirmButtonText: "送出申請",
      cancelButtonText: "取消",
      confirmButtonColor: "#0b5a83",
      showCancelButton: true,
      focusConfirm: false,
      didOpen: () => {
        const popup = Swal.getPopup() as HTMLElement;
        // Enter submits, Shift+Enter starts a new line; an Enter that picks
        // an IME candidate (注音/拼音) does neither.
        for (const field of popup.querySelectorAll("textarea")) {
          field.onkeydown = (e: KeyboardEvent) => {
            if (isSubmitEnter(e)) {
              e.preventDefault();
              Swal.clickConfirm();
            }
          };
        }
      },
      preConfirm: async () => {
        const popup = Swal.getPopup() as HTMLElement;
        const [q1, q2, q3] = QUESTIONS.map((q) =>
          (
            popup.querySelector(`#${q.id}`) as HTMLTextAreaElement | null
          )?.value.trim(),
        );
        if (!q1 || !q2 || !q3) {
          Swal.showValidationMessage("請回答所有問題");
          return false;
        }

        const res = await JoinSigAPI({ sig: sigId, q1, q2, q3 }, authToken);
        if (res.ok) {
          setRequest("pending");
          Swal.fire({
            title: "已送出申請",
            text: "請等待 SIG 幹部審核",
            icon: "success",
            confirmButtonText: "好",
            confirmButtonColor: "#0b5a83",
          });
        } else {
          Swal.fire({
            title: "申請失敗",
            text: joinErrorMessage(res),
            icon: "error",
            confirmButtonText: "好",
            confirmButtonColor: "#0b5a83",
          });
        }
      },
    });
  }

  return { label, disabled, join };
}

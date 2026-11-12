"use client";

import { useEffect, useState } from "react";
import { ReadJoinSigAPI } from "@/app/[userID]/(User)/apis/JoinSigAPI";
import type { JoinOutcome } from "@/components/Sig/JoinSigDialog";
import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import { isRecruitingNow } from "@/modules/sigRecruiting";
import { promptLogin } from "@/utils/loginPrompt";
import { useUserAccount } from "@/utils/useUserAccount";

/**
 * State and action of the 「加入 SIG」 button on a SIG page, shared by the
 * desktop and mobile profile cards. Logged-out visitors get an enabled
 * button that explains joining needs an account and offers to log in.
 *
 * The state is the user's newest join request (the backend returns that
 * one): pending → 審核中, a member → 已加入, rejected → the user may apply
 * again, with a notice that the last one was declined. A SIG that is not
 * recruiting (contract v4 §5.6) shows 暫停招生 to everyone who could
 * apply.
 *
 * The form itself is `<JoinSigDialog {...joinSig.dialog} sig={sig} />`.
 */
export function useJoinSig(account: User | Sig | null, isSig: boolean) {
  const { token, userData, isLoading: authLoading, login } = useUserAccount();
  // "" = not known yet; "none" = no request, may apply; "joined" = the
  // server said the user is already a member (4028).
  // Otherwise the newest request's state: pending, accepted or rejected.
  const [request, setRequest] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  // The server refused with 4040 although the page thought it was open.
  const [closedByServer, setClosedByServer] = useState(false);
  const sigId = isSig ? account?._id : undefined;

  useEffect(() => {
    setClosedByServer(false);
    setDialogOpen(false);
  }, [sigId]);

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
  // An accepted request from someone the profile no longer lists as a
  // member (taken out of the SIG later): they may apply again. Without a
  // profile, trust the request.
  const leftSig = request === "accepted" && Boolean(userData) && !isMember;
  const state =
    isMember || request === "joined" ? "accepted" : leftSig ? "none" : request;
  const recruiting =
    isSig && !closedByServer && isRecruitingNow(account as Sig | null);
  // Pending requests stay 審核中; only a new application needs recruiting.
  const closed =
    !recruiting && (state === "none" || state === "rejected" || state === "");

  const label = closed
    ? "暫停招生"
    : state === "pending"
      ? "審核中"
      : state === "accepted"
        ? "已加入"
        : state === "rejected"
          ? "再次申請"
          : "申請加入";
  const disabled =
    closed || state === "" || state === "pending" || state === "accepted";
  const notice =
    state === "rejected"
      ? closed
        ? "上次的申請未通過，重新開放招生後可以再次申請"
        : "上次的申請未通過，可以再次申請"
      : null;
  const member = state === "accepted";

  /** After leaving the SIG: the user may apply again. */
  function markLeft() {
    setRequest("none");
  }

  function join() {
    if (!sigId || closed) {
      return;
    }
    if (!token) {
      promptLogin(login, { text: "登入後即可申請加入 SIG" });
      return;
    }
    setDialogOpen(true);
  }

  function onOutcome(outcome: JoinOutcome) {
    if (outcome === "pending") {
      setRequest("pending");
    } else if (outcome === "joined") {
      setRequest("joined");
    } else {
      setClosedByServer(true);
    }
  }

  return {
    label,
    disabled,
    notice,
    join,
    isMember: member,
    markLeft,
    /** False when the SIG does not take new applications now. */
    recruiting,
    /** Props for `<JoinSigDialog>`. */
    dialog: {
      open: dialogOpen,
      onClose: () => setDialogOpen(false),
      onOutcome,
    },
  };
}

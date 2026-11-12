"use client";

import Swal from "sweetalert2";

import type { Sig } from "@/interfaces/Sig";
import { CustomStatus } from "@/modules/customStatusCode";
import { useUserAccount } from "@/utils/useUserAccount";

import { LeaveSigAPI } from "./apis/JoinSigAPI";

/**
 * 「退出 SIG」 on a SIG page you are a member of: asks first, then
 * `DELETE /sig/:sigId/members/me` (contract v3 §3.5). On success the
 * signed-in profile drops the SIG, so the page shows 「加入 SIG」 again.
 */
export function useLeaveSig({
  sig,
  isLeader,
  isModerator,
  onLeft,
  notify,
}: {
  sig: Sig | null;
  isLeader: boolean;
  isModerator: boolean;
  onLeft: () => void;
  notify: (icon: "success" | "error", message: string) => void;
}) {
  const { token, updateUser } = useUserAccount();

  function dropFromProfile(sigId: string) {
    updateUser((user) => ({
      ...user,
      sig: (user.sig ?? []).filter((id) => id !== sigId),
    }));
    onLeft();
  }

  async function leave() {
    const sigId = sig?._id;
    if (!sigId || !token) {
      return;
    }
    const role = isModerator ? "指導老師" : isLeader ? "幹部" : null;
    const lines = [
      "退出後要再加入，需要重新申請。",
      role
        ? `你在這個 SIG 的${role}身分不會因此取消，需要時請聯絡管理員。`
        : "",
    ].filter(Boolean);

    const confirm = await Swal.fire({
      title: `確定要退出「${sig.name}」嗎？`,
      text: lines.join(""),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "退出",
      confirmButtonColor: "#b42318",
      cancelButtonText: "取消",
      focusCancel: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: () => LeaveSigAPI(sigId, token),
    });
    if (!confirm.isConfirmed || !confirm.value) {
      return;
    }
    const result = confirm.value;
    if (result.ok) {
      dropFromProfile(sigId);
      notify("success", `已退出「${sig.name}」`);
      return;
    }
    if (result.status === CustomStatus.NOT_A_MEMBER) {
      // Already out (another tab, or a manager removed you).
      dropFromProfile(sigId);
      notify("error", "你已經不是這個 SIG 的成員");
      return;
    }
    notify("error", `退出失敗：${result.message}`);
  }

  return { leave };
}

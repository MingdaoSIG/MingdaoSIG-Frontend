"use client";

import { useMemo } from "react";
import { useSigNames } from "../(admin)/api";
import { PageHeader } from "../(admin)/components/AdminShell";
import { JoinRequestList } from "../(admin)/components/JoinRequests";
import { useAdmin } from "../(admin)/context";

// 入社申請: every pending request the caller may decide. Admins see all
// SIGs; leaders and 指導老師 only their own (the backend scopes the list).

export default function AdminJoinRequestsPage() {
  const admin = useAdmin();
  const { sigs } = useSigNames();

  const sigOptions = useMemo(() => {
    const own = admin.isAdmin
      ? sigs
      : sigs.filter((sig) => admin.managedSigIds.includes(sig._id));
    return [
      {
        value: "",
        label: admin.isAdmin ? "全部 SIG" : "我管理的全部 SIG",
      },
      ...own.map((sig) => ({ value: sig._id, label: sig.name })),
    ];
  }, [sigs, admin]);

  return (
    <>
      <PageHeader
        title="入社申請"
        description="看申請人填的答案，在這裡同意或拒絕；結果會寄信通知申請人。"
      />
      <JoinRequestList sigOptions={sigOptions} />
    </>
  );
}

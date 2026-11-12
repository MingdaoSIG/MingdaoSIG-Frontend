"use client";

import { PageHeader } from "../(admin)/components/AdminShell";
import { AlumniCleanup } from "../(admin)/rollover/AlumniCleanup";
import { MergeAndMove } from "../(admin)/rollover/MergeAndMove";
import { NextLeaders } from "../(admin)/rollover/NextLeaders";

// 學年交接 (contract v4 §5.7): what an admin does once a year, in order.

export default function AdminRolloverPage() {
  return (
    <>
      <PageHeader
        title="學年交接"
        description="每學年結束時：整理畢業生、設定下一屆幹部，再處理要合併或停辦的 SIG。"
      />
      <div className="flex flex-col gap-4">
        <AlumniCleanup />
        <NextLeaders />
        <MergeAndMove />
      </div>
    </>
  );
}

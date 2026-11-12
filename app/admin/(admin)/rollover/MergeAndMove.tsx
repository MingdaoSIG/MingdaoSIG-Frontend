"use client";

import { FolderInput, Merge } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { useAdminSigs } from "../api";
import { buttonClass, Card, selectClass } from "../components/ui";

// 學年交接 step 3: SIGs that close or combine at the turn of the year.
// Merging lives on the SIG's page (with its dry run), moving posts in 貼文.

export function MergeAndMove() {
  const selectId = useId();
  const sigs = useAdminSigs();
  const [source, setSource] = useState("");
  return (
    <Card title="3. 合併與搬移">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-ink-800 text-sm">合併 SIG</h3>
          <p className="text-ink-500 text-sm">
            把一個 SIG 的貼文、成員和待審申請併到另一個
            SIG，舊網址會轉過去，原本的 SIG 會被封存。合併前會先試算。
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label
                htmlFor={selectId}
                className="font-semibold text-ink-500 text-xs"
              >
                要合併掉的 SIG
              </label>
              <select
                id={selectId}
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className={selectClass}
              >
                <option value="">選擇 SIG…</option>
                {(sigs.data ?? []).map((sig) => (
                  <option key={sig._id} value={sig._id}>
                    {sig.name}
                  </option>
                ))}
              </select>
            </div>
            <Link
              href={source ? `/admin/sigs/${source}?merge=1` : "#"}
              aria-disabled={!source}
              className={`${buttonClass("secondary")} ${source ? "" : "pointer-events-none opacity-50"}`}
            >
              <Merge aria-hidden className="size-4" />
              開始合併
            </Link>
          </div>
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-ink-800 text-sm">搬移貼文</h3>
          <p className="text-ink-500 text-sm">
            在「貼文」勾選貼文後按「搬移到其他 SIG」；篩選一個 SIG
            時，也可以一次搬移它的全部貼文。
          </p>
          <div>
            <Link href="/admin/posts" className={buttonClass("secondary")}>
              <FolderInput aria-hidden className="size-4" />
              前往貼文
            </Link>
          </div>
        </section>
      </div>
    </Card>
  );
}

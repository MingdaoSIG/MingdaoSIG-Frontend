"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { DocCard, DocPage } from "@/components/desktop/DocPage";
import { imageUrl } from "@/modules/imageUrl";

import { countOf, useSigLookup } from "../useSigLookup";

/** /data on desktop: the same SIG lookup as the mobile page. */
export default function Desktop() {
  const { sigData, message, searching, lookup } = useSigLookup();
  const [value, setValue] = useState("");
  const avatar = sigData ? imageUrl(sigData.avatar) : undefined;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    lookup(value);
  }

  return (
    <DocPage title="MDSIG 資料查詢系統" width="narrow">
      <DocCard title="SIG 資料查詢">
        <p className="mb-4 text-ink-500 text-sm">
          輸入 SIG 的 ID（例如 @mdcsl），查看簡介、指導老師與幹部人數。
        </p>
        <form onSubmit={onSubmit} className="flex gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-control border border-line-strong bg-surface px-3 focus-within:border-brand-700/50 focus-within:ring-2 focus-within:ring-brand-700/20">
            <Search size={18} className="shrink-0 text-ink-500" aria-hidden />
            <span className="sr-only">SIG 的 ID，例如 @mdcsl</span>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="@mdcsl"
              className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={searching}
            className="h-11 shrink-0 cursor-pointer rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70"
          >
            {searching ? "查詢中…" : "查詢"}
          </button>
        </form>
      </DocCard>

      {sigData === 0 && (
        <DocCard>
          <p role="alert" className="text-center text-ink-700">
            {message}
          </p>
        </DocCard>
      )}

      {sigData !== null && sigData !== 0 && (
        <DocCard>
          <div className="flex items-center gap-4">
            {avatar ? (
              <Image
                src={avatar}
                width={56}
                height={56}
                alt=""
                className="size-14 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="size-14 shrink-0 rounded-full bg-field" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-bold text-ink-900 text-xl">
                {sigData.name}
              </h2>
              {sigData.customId && (
                <p className="text-ink-500 text-sm">@{sigData.customId}</p>
              )}
            </div>
            {sigData.customId && (
              <Link
                href={`/@${sigData.customId}`}
                className="inline-flex h-10 shrink-0 items-center rounded-control border border-line-strong bg-surface px-4 font-semibold text-brand-700 text-sm transition-colors hover:bg-field"
              >
                前往 SIG 頁面
              </Link>
            )}
          </div>
          <dl className="mt-5 grid grid-cols-[6rem_1fr] gap-x-4 gap-y-3 text-[15px]">
            <dt className="text-ink-500">簡介</dt>
            <dd className="whitespace-pre-line break-words text-ink-800 leading-[1.7]">
              {sigData.description || "尚未填寫"}
            </dd>
            <dt className="text-ink-500">指導老師</dt>
            <dd className="text-ink-800">{countOf(sigData.moderator)} 位</dd>
            <dt className="text-ink-500">幹部</dt>
            <dd className="text-ink-800">{countOf(sigData.leader)} 位</dd>
          </dl>
        </DocCard>
      )}
    </DocPage>
  );
}

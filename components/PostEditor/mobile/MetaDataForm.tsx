"use client";

import { useSigOptions } from "../shared/useSigOptions";
// Types
import type { TPostAPI } from "../types/postAPI";

interface Props {
  data: TPostAPI | undefined;
  handleFormEventFunction: (e: {
    target: { name: string; value: string | string[] };
  }) => void;
  /** The SIG an edited post is already in (always selectable). */
  originalSig?: string;
}

export default function MetaDataForm({
  data,
  handleFormEventFunction,
  originalSig,
}: Props) {
  const sigOptions = useSigOptions(originalSig);

  return (
    <div className="mx-auto grid h-auto w-full grid-rows-2 gap-2">
      <input
        type="text"
        name="title"
        placeholder="請輸入標題......"
        aria-label="標題"
        value={data?.title}
        onChange={(e) => handleFormEventFunction(e)}
        className="rounded-control border border-line-strong bg-surface px-3 py-2.5 text-[16px] text-ink-900 placeholder:text-ink-400"
      />
      <div className="w-full items-center justify-center rounded-control border border-line-strong bg-surface px-2 py-2 text-left">
        <select
          name="sig"
          aria-label="SIG"
          className="h-full w-full bg-surface pr-2 text-[16px] text-ink-800"
          value={data?.sig}
          onChange={(e) => {
            handleFormEventFunction(e);
          }}
        >
          <option value="">請選擇 SIG</option>
          {sigOptions.map((sig) => (
            <option value={sig.id} key={sig.id} disabled={!sig.allowed}>
              {sig.allowed ? sig.name : `${sig.name}（未加入）`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

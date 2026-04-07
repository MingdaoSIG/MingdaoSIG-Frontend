"use client";

import { useEffect, useState } from "react";
import type { Sig } from "@/interfaces/Sig";
// Modules
import sigAPI from "@/modules/sigAPI";
// Types
import type { TPostAPI } from "../types/postAPI";

interface Props {
  data: TPostAPI | undefined;
  handleFormEventFunction: (e: {
    target: { name: string; value: string | string[] };
  }) => void;
}

export default function MetaDataForm({ data, handleFormEventFunction }: Props) {
  const [sigs, setSigs] = useState<Sig[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigList();
        setSigs(response);
      } catch (error: unknown) {
        console.error(error instanceof Error ? error.message : error);
      }
    })();
  }, []);

  return (
    <div className="mx-auto grid h-auto w-full grid-rows-2 gap-2">
      <input
        type="text"
        name="title"
        placeholder="請輸入標題......"
        value={data?.title}
        onChange={(e) => handleFormEventFunction(e)}
        className="rounded-lg border border-gray-300 px-2 py-2"
      />
      <div className="w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-2 py-2 text-left">
        <select
          name="sig"
          className="h-full w-full rounded-lg bg-white pr-2 text-base"
          value={data?.sig}
          onChange={(e) => {
            handleFormEventFunction(e);
          }}
        >
          <option value="">請選擇 SIG</option>
          {sigs?.map((sig) => {
            return (
              <option value={sig._id} key={sig._id}>
                {sig.name}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}

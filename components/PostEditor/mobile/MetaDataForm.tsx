"use client";

import { useEffect, useState } from "react";

// Types
import type { TPostAPI } from "../types/postAPI";

// Modules
import sigAPI from "@/modules/sigAPI";

interface Props {
  data: TPostAPI | undefined;
  handleFormEventFunction: Function;
}

export default function MetaDataForm({ data, handleFormEventFunction }: Props) {
  const [sigs, setSigs] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigList();
        setSigs(response);
      } catch (error: any) {
        console.error(error.message);
      }
    })();
  }, []);

  return (
    <div className="h-auto w-full mx-auto grid grid-rows-2 gap-2">
      <input
        type="text"
        name="title"
        placeholder="請輸入標題......"
        value={data?.title}
        onChange={(e) => handleFormEventFunction(e)}
        className="rounded-lg px-2 py-2 border border-gray-300"
      />
      <div className="w-full border border-gray-300 rounded-lg px-2 py-2 text-left items-center justify-center bg-white">
        <select
          name="sig"
          className="rounded-lg pr-2 text-base w-full h-full bg-white"
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
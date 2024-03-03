"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Styles
import styles from "./MetaDataForm.module.scss";

// Types
import { TPostAPI } from "../types/postAPI";

// Modules
import sigAPI from "@/modules/sigAPI";

interface Props {
  data: TPostAPI | undefined;
  handleFormEventFunction: Function;
}

export default function MetaDataForm({ data, handleFormEventFunction }: Props) {
  const { status } = useSession();
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

  if (status === "loading") {
    return <div>Please Login First</div>;
  }

  return (
    <div className={styles.meta}>
      <input
        type="text"
        name="title"
        placeholder="Title"
        value={data?.title}
        onChange={(e) => handleFormEventFunction(e)}
        className={styles.input}
      />
      <select
        name="sig"
        className={styles.input}
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
  );
}

/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

// Components
import Buttons from "./Buttons";

// Styles
import styles from "./MetaDataForm.module.scss";

// Types
import { Sig } from "@/interfaces/Sig";
import { TThread } from "@/interfaces/Thread";

// Modules
import sigAPI from "@/modules/sigAPI";

//utils
import { useUserAccount } from "@/utils/useUserAccount";

interface Props {
  oldPostData: TThread;
  undoFunction: Function;
  sendEditFunction: Function;
  editButtonDisable: boolean;
}

export default function MetaDataForm({
  oldPostData,
  undoFunction,
  sendEditFunction,
  editButtonDisable,
}: Props) {
  const { isLoading } = useUserAccount();
  const [sig, setSig] = useState<Sig>();

  useEffect(() => {
    if (oldPostData.sig) {
      (async () => {
        try {
          const response = await sigAPI.getSigData(oldPostData.sig);
          setSig(response);
        } catch (error: any) {
          console.error(error.message);
        }
      })();
    }
  }, [oldPostData]);

  if (isLoading || !oldPostData) {
    return (
      <div></div>
    );
  }

  return (
    <>
      <div className={styles.meta}>
        <label className={styles.label}>Title:</label>
        <p className={styles.title_name}>{oldPostData.title}</p>
        <label className={styles.label}>SIGs:</label>
        <p className={styles.title_name}>{sig?.name}</p>
        <label className={styles.label}>Cover:</label>
        <img
          src={oldPostData?.cover!}
          alt="cover" hidden={(oldPostData.cover) ? false : true}
          className={styles.cover}
          style={{ objectFit: "cover" }}
          sizes="100%"
        />
      </div >
      <Buttons
        undoFunction={undoFunction}
        sendEditFunction={sendEditFunction}
        editButtonDisable={editButtonDisable}
      />
    </>
  );
}

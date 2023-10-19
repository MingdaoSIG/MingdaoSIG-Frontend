"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Components
import Buttons from "./Buttons";

// Styles
import styles from "./MetaDataForm.module.scss";

// Types
import { TPostAPI } from "@/app/new/(new)/types/postAPI";

// APIs Request Function
import { getSigListAPI } from "@/app/new/(new)/apis/getSigListAPI";

interface Props {
  discardFunction: Function;
  postFunction: Function;
  postData: TPostAPI | undefined;
  handleFormEventFunction: Function;
  postButtonDisable: boolean;
}

export default function MetaDataForm({
  discardFunction,
  postFunction,
  handleFormEventFunction,
  postData,
  postButtonDisable,
}: Props) {
  const { status } = useSession();

  const [sigs, setSigs] = useState<any[]>([]);
  useEffect(() => {
    getSigListAPI(setSigs);
  }, []);

  if (status === "unauthenticated") {
    return (
      <div className={styles.unLoginMessage}>
        <h1>Please login to post.</h1>
      </div>
    );
  } else if (status === "loading") {
    return <div></div>;
  } else {
    return (
      <>
        <div className={styles.meta}>
          <label className={styles.inputLabel}>Title:</label>
          <input
            type="text"
            name="title"
            className={styles.input}
            value={postData?.title}
            onChange={(e) => handleFormEventFunction(e)}
          />

          <label className={styles.inputLabel}>SIGs:</label>
          <select
            name="sig"
            className={styles.input}
            value={postData?.sig}
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

          {/* <label className={styles.inputLabel}>Hashtag:</label>
          <input name="hashtag" type="text" className={styles.input} disabled /> */}
        </div>
        <Buttons
          discardFunction={discardFunction}
          postFunction={postFunction}
          postButtonDisable={postButtonDisable}
        />
      </>
    );
  }
}

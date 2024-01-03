"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Components
import Buttons from "./Buttons";

// Styles
import styles from "./MetaDataForm.module.scss";

// Types
import { TPostAPI } from "@/app/new/(new)/types/postAPI";

// Modules
import sigAPI from "@/modules/sigAPI";

interface Props {
  discardFunction: Function;
  postFunction: Function;
  data: TPostAPI | undefined;
  handleFormEventFunction: Function;
  postButtonDisable: boolean;
}

export default function MetaDataForm({
  discardFunction,
  postFunction,
  handleFormEventFunction,
  data,
  postButtonDisable,
}: Props) {
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
            value={data?.title}
            onChange={(e) => handleFormEventFunction(e)}
          />

          <label className={styles.inputLabel}>SIGs:</label>
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
              if (sig._id === "652d60b842cdf6a660c2b778") return;
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

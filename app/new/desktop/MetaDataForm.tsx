"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SweetAlertResult } from "sweetalert2";

// Components
import Buttons from "./Buttons";

// Styles
import styles from "./MetaDataForm.module.scss";

// Types
import { TPostAPI } from "../types/postAPI";

interface Props {
  discardFunction: Function;
  postFunction: Function;
  postData: TPostAPI | undefined;
  handleFormEventFunction: Function;
}

export default function MetaDataForm({
  discardFunction,
  postFunction,
  handleFormEventFunction,
  postData,
}: Props) {
  const { data, status } = useSession();

  const [sigs, setSigs] = useState<any[]>([]);
  useEffect(() => {
    GetSigListAPI();
    async function GetSigListAPI() {
      try {
        const res = await (
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/list`, {
            method: "GET",
          })
        ).json();
        setSigs(res.postData);
        return;
      } catch (error) {
        console.log(error);
      }
    }
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

          <label className={styles.inputLabel}>Hashtag:</label>
          <input name="hashtag" type="text" className={styles.input} disabled />
        </div>
        <Buttons
          discardFunction={discardFunction}
          postFunction={postFunction}
        />
      </>
    );
  }
}

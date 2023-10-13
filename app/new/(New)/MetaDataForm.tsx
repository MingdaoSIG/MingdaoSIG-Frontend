"use client";

import styles from "./MetaDataForm.module.scss";
import Buttons from "./Buttons";

export default function MetaDataForm() {
  return (
    <div className={"h-full"}>
      <div className={styles.meta}></div>
      <Buttons></Buttons>
    </div>
  );
}

"use client";

import { MdPreview } from "md-editor-rt";
import styles from "./Rules.module.scss";
import "md-editor-rt/lib/preview.css";

export default function Rules() {
  const rules =
    "";

  return (
    <div className="h-[65dvh] w-[90dvw] mx-auto flex flex-col ">
      <div className="bg-white bg-opacity-50 rounded-[30px]">
        <MdPreview modelValue={rules} className={styles.md} />
      </div>
    </div>
  );
}

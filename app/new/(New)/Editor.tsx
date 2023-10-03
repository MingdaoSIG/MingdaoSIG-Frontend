"use client";

import { useState } from "react";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import styles from "./editor.module.scss";

export default () => {
  const [text, setText] = useState("# Hello Editor");
  return (
    <div className={"rounded-xl overflow-hidden " + styles.editor}>
      <MdEditor modelValue={text} onChange={setText} />
    </div>
  );
};

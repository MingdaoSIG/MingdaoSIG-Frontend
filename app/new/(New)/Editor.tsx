"use client";

import { useState } from "react";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import styles from "./editor.module.scss";

export default () => {
  const [text, setText] = useState("# Hello Editor");

  const onUploadImg = async (files: any[], callback: (arg0: any[]) => void) => {
    const res = await Promise.all(
      files.map((file: any) => {
        return new Promise((rev, rej) => {
          try {
            fetch("https://sig.zeabur.app/image", {
              method: "POST",
              headers: {
                "Content-Type": "image/webp",
                Authorization: "",
              },
              body: file,
            });
          } catch (error) {}
        });
      })
    );

    callback(res.map((item: any) => item?.data.url));
  };

  return (
    <div
      className={
        "pt-1 bg-white rounded-[30px] overflow-hidden " + styles.editor
      }
    >
      <MdEditor modelValue={text} onChange={setText} />
    </div>
  );
};

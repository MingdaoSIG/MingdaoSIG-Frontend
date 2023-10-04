"use client";

import { useEffect, useState } from "react";
import { MdEditor, ToolbarNames } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import styles from "./editor.module.scss";

const MarkdownGuide=
`
# Welcome to MDSIG Post Editor
If you're unfamiliar with Markdown, please refer to this [tutorial](https://www.markdownguide.org/).

# 歡迎使用 MDSIG 文章編輯器
如果您對於 Markdown 不熟悉，請參考這個 [教學](https://www.markdownguide.org/).
`;

const Editor = () => {
  const [text, setText] = useState(MarkdownGuide);

  useEffect(() => {
    console.log(text);
  }, [text]);

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
          } catch (error) {
            console.log("errrrrrrrrrr: ", error);
          }
        });
      })
    );

    callback(res.map((item: any) => item?.data.url));
  };

  const toolbars: ToolbarNames[] = [
    "bold",
    "underline",
    "italic",
    // "-",
    "strikeThrough",
    // "title",
    "sub",
    "sup",
    "quote",
    // "unorderedList",
    // "orderedList",
    "task",
    "-",
    "codeRow",
    "code",
    "link",
    "image",
    "table",
    "mermaid",
    "katex",
    // "save",
    "=",
    "revoke",
    "next",
    "-",
    "pageFullscreen",
    // "fullscreen",
    "preview",
    "htmlPreview",
    "catalog",
    // "github"
  ];

  return (
    <div
      className={
        "pt-1 bg-white rounded-[30px] overflow-hidden " + styles.editor
      }
    >
      <MdEditor modelValue={text} onChange={setText} toolbars={toolbars} />
    </div>
  );
};

export default Editor;

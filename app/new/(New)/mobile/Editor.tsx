import { Dispatch } from "react";
import { MdEditor, ToolbarNames } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import styles from "./editor.module.scss";
import React from "react";

const MdEditorSync = ({
  setFunction,
  editorContent,
}: {
  setFunction: Dispatch<React.SetStateAction<string>>;
  editorContent: string;
}) => {
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
    "htmlPreview",
    "catalog",
    // "github"
  ];

  const handleEditorChange = (newContent: string) => {
    setFunction(newContent);
    localStorage.setItem("editorContent", newContent);
  };

  return (
    <div className={styles.editor}>
      <MdEditor
        modelValue={editorContent}
        onChange={handleEditorChange}
        toolbars={toolbars}
        onUploadImg={onUploadImg}
        language="en-US"
        previewTheme="github"
        preview={false}
      />
    </div>
  );
};

export default MdEditorSync;

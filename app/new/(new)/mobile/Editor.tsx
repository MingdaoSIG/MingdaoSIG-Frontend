import { Dispatch, SetStateAction } from "react";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";

// Styles
import styles from "./Editor.module.scss";

// Interfaces
import { TPostAPI } from "../types/postAPI";

// Configs
import { toolbars } from "../config/editorToolbar";

interface Props {
  postData: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
}

const MdEditorSync = ({ postData, setPostData, token }: Props) => {
  const onUploadImg = async (files: any[], callback: (arg0: any[]) => void) => {
    const res = await Promise.all(
      files.map((file: any) => {
        return new Promise((rev, rej) => {
          try {
            fetch("https://sig.zeabur.app/image", {
              method: "POST",
              headers: {
                "Content-Type": "image/webp",
                Authorization: "Bearer " + token,
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

  const handleEditorChange = (newContent: string) => {
    setPostData(
      (prev: TPostAPI | undefined) =>
        ({
          ...prev,
          content: newContent,
        } as TPostAPI)
    );
    localStorage.setItem("editorContent", newContent);
  };

  return (
    <div className={styles.editor}>
      <MdEditor
        modelValue={postData?.content || ""}
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

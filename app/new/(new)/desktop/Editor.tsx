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
    console.log(files);
    const res = await Promise.all(
      files.map((file: any) => {
        return new Promise((rev, rej) => {
          console.log(file);
          try {
            fetch("https://sig-api-dev.lazco.dev/image", {
              method: "POST",
              headers: {
                "Content-Type": "image/webp",
                Authorization: token,
              },
              body: file,
              redirect: "follow",
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
      (prev: TPostAPI) =>
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
      />
    </div>
  );
};

export default MdEditorSync;

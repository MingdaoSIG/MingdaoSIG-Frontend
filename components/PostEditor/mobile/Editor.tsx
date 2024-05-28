import { Dispatch, SetStateAction } from "react";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";

// Styles
import styles from "./Editor.module.scss";

// Interfaces
// import { IImageUpload } from "@/interfaces/Image.interface";

// Types
import { TPostAPI } from "../types/postAPI";

// Configs
import { toolbars } from "../config/editorToolbar";

// APIs Request Function
import { imageUpload } from "@/modules/imageUploadAPI";

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
}

const MdEditorSync = ({ data, setPostData, token }: Props) => {
  const onUploadImg = async (files: any[], callback: (arg0: any[]) => void) => {
    const responseImage = await Promise.all(
      files.map(async (file: any) => {
        try {
          const res = await imageUpload(file, token);
          return await res.json();
        } catch (error) {
          console.error("error: ", error);
          return "Error uploading image";
        }
      })
    );

    console.log(responseImage);

    callback(responseImage.map((item: any) => `${process.env.NEXT_PUBLIC_API_URL}/image/` + item?.id));
  };

  const handleEditorChange = (newContent: string) => {
    setPostData((prev: TPostAPI) => ({
      ...prev,
      content: newContent,
    } as TPostAPI));
    localStorage.setItem("editorContent", newContent);
  };

  return (
    <div className={styles.editor}>
      <MdEditor
        modelValue={data?.content || ""}
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

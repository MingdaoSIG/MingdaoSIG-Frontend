import { Dispatch, SetStateAction } from "react";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";

// Styles
import styles from "./Editor.module.scss";

// Interfaces
import { TPostAPI } from "../types/postAPI";

// Configs
import { toolbars } from "../config/editorToolbar";
import { imageUpload } from "@/modules/imageUploadAPI";
import Swal from "sweetalert2";

// Use User Account
import { useUserAccount } from "@/utils/useUserAccount";

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
}

const MdEditorSync = ({ data, setPostData }: Props) => {
  const { token } = useUserAccount();
  const onUploadImg = async (files: any[], callback: (arg0: any[]) => void) => {
    if (!files.length) return;
    const responseImage = await Promise.all(
      files.map(async (file: any) => {
        const validImageTypes = ["image/webp", "image/jpeg", "image/png", "image/tiff"];

        if (!validImageTypes.includes(file.type)) {
          Swal.fire("File type not supported", "You can only upload  png,  jpg,  webp, tiff", "error");
          return;
        }

        if (file.size > 5 * 1000 * 1000) {
          Swal.fire("File too large", "You can only upload files under 5MB", "error");
          return;
        }

        try {
          const res = await imageUpload(file, token);
          return await res.json();
        } catch (error) {
          console.error("error: ", error);
          Swal.fire("Error", "Something went wrong. Please try again later", "error");
          return;
        }
      })
    );

    if (responseImage[0] !== undefined) {
      callback(responseImage.map((item: any) => `${process.env.NEXT_PUBLIC_API_URL}/image/` + item?.id));
    }
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
      />
    </div>
  );
};

export default MdEditorSync;

import { MdEditor, MdPreview } from "md-editor-rt";
import type { Dispatch, SetStateAction } from "react";
import "md-editor-rt/lib/style.css";
import "@/app/mdEditorConfig";

import type { IImageUpload } from "@/interfaces/Image.interface";
// APIs Request Function
import { imageUpload } from "@/modules/imageUploadAPI";

// Configs
import { toolbars } from "../config/editorToolbar";
// Types
import type { TPostAPI } from "../types/postAPI";

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
}

const MdEditorSync = ({ data, setPostData, token }: Props) => {
  const onUploadImg = async (
    files: File[],
    callback: (urls: string[]) => void,
  ) => {
    const responseImage = await Promise.all(
      files.map(async (file: File) => {
        try {
          const res = await imageUpload(file, token);
          return await res.json();
        } catch (error) {
          console.error("error: ", error);
          return "Error uploading image";
        }
      }),
    );
    callback(
      responseImage.map(
        (item: IImageUpload | string) =>
          `${process.env.NEXT_PUBLIC_API_URL}/image/${typeof item === "object" ? item?.id : ""}`,
      ),
    );
  };

  const handleEditorChange = (newContent: string) => {
    setPostData(
      (prev: TPostAPI) =>
        ({
          ...prev,
          content: newContent,
        }) as TPostAPI,
    );
    localStorage.setItem("editorContent", newContent);
    localStorage.setItem("postData", JSON.stringify(data));
  };

  return (
    <div className="w-full space-y-2">
      {/* 編輯器區域 */}
      <div className="editor-wrapper mx-auto h-[20rem] w-full overflow-hidden rounded-md border border-gray-300 bg-white py-1">
        <MdEditor
          value={data?.content || ""}
          onChange={handleEditorChange}
          onUploadImg={onUploadImg}
          language="en-US"
          previewTheme="github"
          preview={false}
          toolbars={toolbars}
        />
      </div>

      {/* 預覽區域 */}
      <div className="max-h-[20rem] w-full overflow-hidden rounded-md border border-gray-300 bg-white p-1">
        <div className="h-[19rem] max-w-none overflow-hidden">
          {data?.content ? (
            <MdPreview
              value={data.content}
              previewTheme="github"
              className="!overflow-auto !max-h-[19rem] small-scrollbar max-w-none"
            />
          ) : (
            <p className="text-gray-400">預覽內容將顯示在這裡...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MdEditorSync;

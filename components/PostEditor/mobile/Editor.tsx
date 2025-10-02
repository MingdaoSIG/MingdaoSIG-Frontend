import type { Dispatch, SetStateAction } from "react";
import { MdEditor, MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/style.css";

// Types
import type { TPostAPI } from "../types/postAPI";

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
      }),
    );
    callback(
      responseImage.map(
        (item: any) => `${process.env.NEXT_PUBLIC_API_URL}/image/` + item?.id,
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
      <div className="h-[20rem] w-full bg-white overflow-hidden mx-auto py-1 border border-gray-300 rounded-md editor-wrapper">
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

      {/* 預覽區域 */}
      <div className="w-full bg-white border border-gray-300 rounded-md p-1 h-[19rem]">
        <div className="prose max-w-none">
          {data?.content ? (
            <MdPreview
              modelValue={data.content}
              previewTheme="github"
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
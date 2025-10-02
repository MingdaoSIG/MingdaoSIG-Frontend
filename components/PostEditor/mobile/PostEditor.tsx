import type { Dispatch, SetStateAction } from "react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

// Components
import MetaDataForm from "./MetaDataForm";
import Button from "./Buttons";

// Types
import type { TPostAPI } from "../types/postAPI";

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
  discardFunction: Function;
  handleFormEventFunction: Function;
  postFunction: Function;
  postButtonDisable: boolean;
  isEdit?: boolean;
  handleFileChange: Function;
}

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
});

export default function NewPostMobile({
  setPostData,
  data,
  token,
  discardFunction,
  handleFormEventFunction,
  postFunction,
  postButtonDisable,
  isEdit,
  handleFileChange,
}: Props) {
  const { status } = useSession();
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // 從 data 初始化 tags
  useEffect(() => {
    if (data?.hashtag) {
      setTags(Array.isArray(data.hashtag) ? data.hashtag : []);
    }
  }, [data?.hashtag]);

  const showLoginAlert = () => {
    Swal.fire({
      icon: "warning",
      title: "需要登入",
      text: "請先登入才能上傳封面圖片",
      confirmButtonText: "確定",
      confirmButtonColor: "#5FCDF5",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 檢查登入狀態
    if (status !== "authenticated") {
      showLoginAlert();
      e.target.value = ""; // 清空 input
      return;
    }

    console.log("File input changed:", e.target.files);
    if (handleFileChange) {
      handleFileChange(e);
    }
  };

  const handleFileInputClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    // 檢查登入狀態
    if (status !== "authenticated") {
      e.preventDefault();
      showLoginAlert();
      return;
    }
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (handleFormEventFunction) {
      handleFormEventFunction({ target: { name: "cover", value: "" } });
    }

    const fileInput = document.getElementById("file") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      setTagInput("");

      // 更新父組件的 data
      if (handleFormEventFunction) {
        handleFormEventFunction({
          target: { name: "hashtag", value: newTags },
        });
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);

    // 更新父組件的 data
    if (handleFormEventFunction) {
      handleFormEventFunction({ target: { name: "hashtag", value: newTags } });
    }
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="pt-[4.5rem] px-2 pb-[4.5rem] h-[100dvh] overflow-x-hidden">
      <div className="bg-white h-full rounded-lg p-4 pr-2 overflow-hidden">
        <div className="flex flex-col items-center overflow-y-auto small-scrollbar h-full pr-2 overflow-x-hidden">
          <div className="w-full max-w-full">
            <MetaDataForm
              data={data}
              handleFormEventFunction={handleFormEventFunction}
            />
          </div>

          {/* Content Section */}
          <h2 className="text-left w-full h-auto mt-6 mb-2 text-lg font-semibold text-gray-700">
            Content
          </h2>
          <hr className="border-gray-200 h-px w-full mb-3" />
          <div className="h-auto w-full max-w-full mb-4">
            <Editor setPostData={setPostData} data={data} token={token} />
          </div>

          {/* Hashtag Section */}
          <h2 className="text-left w-full h-auto mt-4 mb-2 text-lg font-semibold text-gray-700">
            Hashtag
          </h2>
          <hr className="border-gray-200 h-px w-full mb-3" />
          <div className="w-full max-w-full">
            {/* Tag Input */}
            <div className="flex gap-2 mb-3 h-auto w-full">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyPress}
                placeholder="新增標籤..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm w-full"
              />
              <button
                onClick={handleAddTag}
                className="px-5 py-2.5 bg-[#5FCDF5] text-white rounded-lg transition-colors font-medium text-sm whitespace-nowrap flex-none"
              >
                ADD
              </button>
            </div>

            {/* Tags Display */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-100 rounded-lg max-w-full">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-sm font-medium break-all"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="active:bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center transition-colors active:scale-90 flex-shrink-0"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cover Section */}
          <h2 className="text-left w-full h-auto mt-4 mb-2 text-lg font-semibold text-gray-700">
            Cover
          </h2>
          <hr className="border-gray-200 h-px w-full mb-3" />
          <div className="w-full max-w-full">
            {data?.cover ? (
              <div className="relative max-w-full min-h-[12rem]">
                <label
                  htmlFor="file"
                  onClick={handleFileInputClick}
                  className="block bg-cover bg-center bg-no-repeat rounded-lg min-h-[12rem] cursor-pointer relative overflow-hidden"
                  style={{
                    backgroundImage: data.cover.includes("http")
                      ? `url(${data.cover})`
                      : `url(${process.env.NEXT_PUBLIC_API_URL!}/image/${data.cover})`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/0 active:bg-black/20 transition-all duration-200 flex items-center justify-center">
                    <span className="text-white opacity-0 active:opacity-100 transition-opacity duration-200 font-medium">
                      點擊更換圖片
                    </span>
                  </div>
                </label>

                <button
                  onClick={handleRemoveCover}
                  className="absolute top-2 right-2 w-9 h-9 bg-red-500 active:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 z-10"
                  title="移除封面"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <label
                htmlFor="file"
                onClick={handleFileInputClick}
                className="min-h-[12rem] border-2 border-dashed border-[#5FCDF5] bg-blue-50 rounded-lg cursor-pointer transition-all active:bg-blue-100 active:scale-[0.98] flex flex-col justify-center items-center gap-3 p-6"
              >
                <div className="text-6xl opacity-60">📷</div>
                <div className="text-[#5FCDF5] font-medium text-base text-center">
                  點擊上傳圖片
                </div>
                <div className="text-gray-500 text-sm text-center">
                  支援 JPG、PNG、GIF 格式
                </div>
              </label>
            )}

            <input
              id="file"
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* Bottom Spacing and Buttons */}
          <div className="w-full border-t border-gray-200 mt-6 mb-4"></div>
          <Button
            discardFunction={discardFunction}
            postFunction={postFunction}
            postButtonDisable={postButtonDisable}
            isEdit={isEdit}
          />
        </div>
      </div>
    </div>
  );
}
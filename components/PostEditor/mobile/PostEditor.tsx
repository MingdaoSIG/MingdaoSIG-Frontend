import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
// Types
import type { TPostAPI } from "../types/postAPI";
import Button from "./Buttons";
// Components
import MetaDataForm from "./MetaDataForm";

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
  discardFunction: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleFormEventFunction: (e: {
    target: { name: string; value: string | string[] };
  }) => void;
  postFunction: () => void;
  postButtonDisable: boolean;
  isEdit?: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

    // console.log("File input changed:", e.target.files);
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
    <div className="h-[100dvh] overflow-x-hidden px-2 pt-[4.5rem] pb-[4.5rem]">
      <div className="h-full overflow-hidden rounded-lg bg-white p-4 pr-2">
        <div className="small-scrollbar flex h-full flex-col items-center overflow-y-auto overflow-x-hidden pr-2">
          <div className="w-full max-w-full">
            <MetaDataForm
              data={data}
              handleFormEventFunction={handleFormEventFunction}
            />
          </div>

          {/* Content Section */}
          <h2 className="mt-6 mb-2 h-auto w-full text-left font-semibold text-gray-700 text-lg">
            Content
          </h2>
          <hr className="mb-3 h-px w-full border-gray-200" />
          <div className="mb-4 h-auto w-full max-w-full">
            <Editor setPostData={setPostData} data={data} token={token} />
          </div>

          {/* Hashtag Section */}
          <h2 className="mt-4 mb-2 h-auto w-full text-left font-semibold text-gray-700 text-lg">
            Hashtag
          </h2>
          <hr className="mb-3 h-px w-full border-gray-200" />
          <div className="w-full max-w-full">
            {/* Tag Input */}
            <div className="mb-3 flex h-auto w-full gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyPress}
                placeholder="新增標籤..."
                className="w-full flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="flex-none whitespace-nowrap rounded-lg bg-[#5FCDF5] px-5 py-2.5 font-medium text-sm text-white transition-colors"
              >
                ADD
              </button>
            </div>

            {/* Tags Display */}
            {tags.length > 0 && (
              <div className="flex max-w-full flex-wrap gap-2 rounded-lg bg-gray-100 p-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 break-all rounded-full bg-blue-100 px-3 py-1.5 font-medium text-blue-600 text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-colors active:scale-90 active:bg-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cover Section */}
          <h2 className="mt-4 mb-2 h-auto w-full text-left font-semibold text-gray-700 text-lg">
            Cover
          </h2>
          <hr className="mb-3 h-px w-full border-gray-200" />
          <div className="w-full max-w-full">
            {data?.cover ? (
              <div className="relative min-h-[12rem] max-w-full">
                <label
                  htmlFor="file"
                  onClick={handleFileInputClick}
                  className="relative block min-h-[12rem] cursor-pointer overflow-hidden rounded-lg bg-center bg-cover bg-no-repeat"
                  style={{
                    backgroundImage: (data.cover.includes("http")
                      ? `url(${data.cover})`
                      : `url(${process.env.NEXT_PUBLIC_API_URL ?? ""}/image/${data.cover})`
                    ).replace(".lazco.dev", ".mingdao.edu.tw"),
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 active:bg-black/20">
                    <span className="font-medium text-white opacity-0 transition-opacity duration-200 active:opacity-100">
                      點擊更換圖片
                    </span>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all duration-200 active:scale-90 active:bg-red-600"
                  title="移除封面"
                >
                  <svg
                    aria-hidden="true"
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
                className="flex min-h-[12rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-[#5FCDF5] border-dashed bg-blue-50 p-6 transition-all active:scale-[0.98] active:bg-blue-100"
              >
                <div className="text-6xl opacity-60">📷</div>
                <div className="text-center font-medium text-[#5FCDF5] text-base">
                  點擊上傳圖片
                </div>
                <div className="text-center text-gray-500 text-sm">
                  支援 png、jpg、webp、tiff 格式
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
          <div className="mt-6 mb-4 w-full border-gray-200 border-t"></div>
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

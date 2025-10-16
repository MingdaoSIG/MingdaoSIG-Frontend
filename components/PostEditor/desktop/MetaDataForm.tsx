"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

// Components
import Buttons from "./Buttons";

// Types
import type { TPostAPI } from "@/components/PostEditor/types/postAPI";


interface Props {
  discardFunction: Function;
  postFunction: Function;
  data: TPostAPI | undefined;
  handleFormEventFunction: Function;
  postButtonDisable: boolean;
  handleFileChange?: Function;
  isEdit?: boolean;
}

export default function MetaDataForm({
  discardFunction,
  postFunction,
  handleFormEventFunction,
  data,
  postButtonDisable,
  handleFileChange,
  isEdit,
}: Props) {
  const { status } = useSession();
  const [isDragging, setIsDragging] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (status !== "authenticated") {
      showLoginAlert();
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0] && handleFileChange) {
      const mockEvent = {
        target: { files: e.dataTransfer.files },
      } as any;
      handleFileChange(mockEvent);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status !== "authenticated") {
      showLoginAlert();
      e.target.value = "";
      return;
    }
    if (handleFileChange) handleFileChange(e);
  };

  const handleFileInputClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (status !== "authenticated") {
      e.preventDefault();
      showLoginAlert();
    }
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (handleFormEventFunction) {
      handleFormEventFunction({ target: { name: "cover", value: "" } });
    }
    const fileInput = document.getElementById("file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      setTagInput("");
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

  if (status === "loading") return <div></div>;

  return (
    <div className="flex flex-col h-full gap-1">
      {/* 白色卡片 - 只有 Cover 和 Hashtag */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl p-4 overflow-y-auto scrollbar-hide">
        {/* Cover Section */}
        <div className="mb-6">
          <label className="font-semibold text-gray-700 text-lg mb-2 block">
            Cover
          </label>

          {data?.cover && data.cover !== "" ? (
            <div className="relative group h-40">
              <label
                htmlFor="file"
                onClick={handleFileInputClick}
                className="block w-full h-full bg-cover bg-center bg-no-repeat rounded-lg cursor-pointer relative overflow-hidden"
                style={{
                  backgroundImage: (data.cover.includes("http")
                    ? `url(${data.cover})`
                    : `url(${process.env.NEXT_PUBLIC_API_URL!}/image/${data.cover})`).replace(".lazco.dev", ".mingdao.edu.tw"),
                }}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium">
                    點擊更換圖片
                  </span>
                </div>
              </label>

              <button
                onClick={handleRemoveCover}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-10"
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
              className={`
                w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all
                flex flex-col justify-center items-center gap-2 p-8
                ${isDragging
                  ? "border-[#4ab8e0] bg-blue-100 scale-[0.98]"
                  : "border-[#5FCDF5] bg-blue-50 hover:bg-blue-100 hover:border-[#4ab8e0]"
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-5xl opacity-60">📷</div>
              <div className="text-[#5FCDF5] font-medium text-sm">
                點擊上傳或拖拽圖片
              </div>
              <div className="text-gray-500 text-xs">
                支援 JPG、PNG、GIF 格式
              </div>
            </label>
          )}

          <input
            id="file"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>

        {/* Hashtag Section */}
        <div className="flex flex-col gap-2">
          <label
            className="font-semibold text-gray-700 text-lg"
            htmlFor="tagInput"
          >
            Hashtag
          </label>

          {/* Tag Input */}
          <div className="flex gap-2">
            <input
              id="tagInput"
              minLength={2}
              maxLength={20}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
              placeholder="新增標籤..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 text-sm"
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-[#5FCDF5] text-white rounded-lg hover:bg-[#4ab8e0] transition-colors font-medium text-sm whitespace-nowrap cursor-pointer"
              type="button"
            >
              ADD
            </button>
          </div>

          {/* Tags Display */}
          {tags.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm h-[1.5rem]"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 按鈕區域 - 獨立在下方 */}
      <div className="flex-shrink-0">
        <Buttons
          discardFunction={discardFunction}
          postFunction={postFunction}
          postButtonDisable={postButtonDisable}
          isEdit={isEdit}
        />
      </div>
    </div>
  );
}
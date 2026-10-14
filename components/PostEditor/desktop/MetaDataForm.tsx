"use client";

import { ImagePlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
// Types
import type { TPostAPI } from "@/components/PostEditor/types/postAPI";
// Components
import Buttons from "./Buttons";

interface Props {
  discardFunction: (e: React.MouseEvent<HTMLButtonElement>) => void;
  postFunction: () => void;
  data: TPostAPI | undefined;
  handleFormEventFunction: (e: {
    target: { name: string; value: string | string[] };
  }) => void;
  postButtonDisable: boolean;
  handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    if (status !== "authenticated") {
      return;
    }
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

    if (e.dataTransfer.files?.[0] && handleFileChange) {
      const mockEvent = {
        target: { files: e.dataTransfer.files },
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(mockEvent);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status !== "authenticated") {
      showLoginAlert();
      e.target.value = "";
      return;
    }
    if (handleFileChange) {
      handleFileChange(e);
    }
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

  if (status === "loading") {
    return <div></div>;
  }

  return (
    <div className="flex h-full flex-col gap-1">
      {/* 白色卡片 - 只有 Cover 和 Hashtag */}
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto rounded-card border border-line bg-surface p-5 shadow-card">
        {/* Cover Section */}
        <div className="mb-6">
          <span className="mb-2 block font-semibold text-base text-ink-900">
            Cover
          </span>

          {data?.cover && data.cover !== "" ? (
            <div className="group relative h-40">
              <label
                htmlFor="file"
                onClick={handleFileInputClick}
                className="relative block h-full w-full cursor-pointer overflow-hidden rounded-control bg-center bg-cover bg-no-repeat"
                style={{
                  backgroundImage: (data.cover.includes("http")
                    ? `url(${data.cover})`
                    : `url(${process.env.NEXT_PUBLIC_API_URL ?? ""}/image/${data.cover})`
                  ).replace(".lazco.dev", ".mingdao.edu.tw"),
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/20">
                  <span className="font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    點擊更換圖片
                  </span>
                </div>
              </label>

              <button
                type="button"
                onClick={handleRemoveCover}
                className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-red-600"
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
              className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-control border-[1.5px] border-dashed p-6 transition-all ${
                isDragging
                  ? "scale-[0.98] border-brand-700 bg-brand-50"
                  : "border-line-strong bg-field hover:border-brand-700/60 hover:bg-brand-50"
              }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <ImagePlus size={32} className="text-ink-400" aria-hidden />
              <div className="font-medium text-brand-700 text-sm">
                點擊上傳或拖拽圖片
              </div>
              <div className="text-center text-ink-500 text-xs leading-5">
                支援 JPG、PNG、WebP、TIFF
                <br />
                檔案需小於 5MB
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
            className="font-semibold text-base text-ink-900"
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
              className="min-w-0 flex-1 rounded-control border border-line bg-field px-3 py-2 text-ink-800 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
            <button
              onClick={handleAddTag}
              className="cursor-pointer whitespace-nowrap rounded-control bg-brand-700 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-brand-800"
              type="button"
            >
              ADD
            </button>
          </div>

          {/* Tags Display */}
          {tags.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, _index) => (
                  <span
                    key={tag}
                    className="inline-flex h-7 items-center gap-1 rounded-chip bg-brand-50 py-1 pr-1.5 pl-2.5 font-medium text-brand-800 text-sm"
                  >
                    #{tag}
                    <button
                      aria-label={`移除標籤 ${tag}`}
                      onClick={() => handleRemoveTag(tag)}
                      className="flex size-5 cursor-pointer items-center justify-center rounded-chip transition-colors hover:bg-brand-700/15"
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

"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
// Desktop Components
import PostEditorDesktop from "@/components/PostEditor/desktop/PostEditor";
// Mobile Components
import PostEditorMobile from "@/components/PostEditor/mobile/PostEditor";
// Modules
import { imageUpload } from "@/modules/imageUploadAPI";
// Utils
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
// Configs
import { alertMessageConfigs } from "../../components/PostEditor/config/alertMessages";
import { markdownGuide } from "../../components/PostEditor/config/markdownGuide";
// Types
import type { TPostAPI } from "../../components/PostEditor/types/postAPI";
// APIs Request Function
import { postAPI } from "./(new)/apis/postAPI";

// 驗證 localStorage 資料的類型
type PostDataSchema = {
  title?: string;
  sig?: string;
  content?: string;
  cover?: string;
  hashtag?: string[];
};

// 驗證並清理 localStorage 資料
function validateStoredData(data: unknown): Partial<TPostAPI> {
  if (typeof data !== "object" || data === null) {
    return {};
  }

  const result: Partial<TPostAPI> = {};
  const typedData = data as PostDataSchema;

  // 驗證 title
  if (typeof typedData.title === "string" && typedData.title.length <= 200) {
    result.title = typedData.title;
  }

  // 驗證 sig（必須是有效的 ObjectId 格式）
  if (typeof typedData.sig === "string") {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (objectIdRegex.test(typedData.sig)) {
      result.sig = typedData.sig;
    }
  }

  // 驗證 content
  if (
    typeof typedData.content === "string" &&
    typedData.content.length <= 100000
  ) {
    result.content = typedData.content;
  }

  // 驗證 cover（必須是有效的 URL）
  if (typeof typedData.cover === "string") {
    try {
      new URL(typedData.cover);
      result.cover = typedData.cover;
    } catch {
      // 無效的 URL，忽略
    }
  }

  // 驗證 hashtag（必須是字串陣列）
  if (Array.isArray(typedData.hashtag)) {
    result.hashtag = typedData.hashtag.filter(
      (tag): tag is string => typeof tag === "string" && tag.length <= 50,
    );
  }

  return result;
}

export default function NewPostPage() {
  const { status } = useSession();
  const { token } = useUserAccount();
  const route = useRouter();
  const isMobile = useIsMobile();

  // ✅ 使用 ref 追蹤是否已經初始化，避免重複清除
  const hasLoadedFromStorage = useRef(false);

  const [postButtonDisable, setPostButtonDisable] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [data, setPostData] = useState<TPostAPI>({
    title: "",
    sig: "",
    content: markdownGuide,
    cover: "",
    hashtag: [],
  });

  function handleFormChange(e: {
    target: { name: string; value: string | string[] };
  }) {
    setPostData(
      (prev: TPostAPI | undefined) =>
        ({
          ...prev,
          [e.target.name]: e.target.value,
        }) as TPostAPI,
    );
  }

  // ✅ 修復：只在真正有內容變化時才保存
  useEffect(() => {
    if (!isInitialized || !hasLoadedFromStorage.current) {
      return;
    }

    const hasContent =
      data.title !== "" ||
      data.sig !== "" ||
      (data.hashtag && data.hashtag.length > 0) ||
      (data.content !== markdownGuide && data.content !== "");

    if (hasContent) {
      localStorage.setItem("postData", JSON.stringify(data));
    }
    // ⚠️ 不要在這裡刪除 postData，讓用戶手動 discard
  }, [data, isInitialized]);

  // ✅ 修復：確保只在組件首次掛載時讀取一次
  useEffect(() => {
    if (hasLoadedFromStorage.current) {
      return;
    }

    const storedContent = localStorage?.getItem("editorContent");
    const storedData = localStorage?.getItem("postData");

    let loadedData: Partial<TPostAPI> = {};

    if (storedContent) {
      loadedData.content = storedContent;
    }

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        // 驗證並清理資料
        const validatedData = validateStoredData(parsed);
        loadedData = { ...loadedData, ...validatedData };
      } catch (error) {
        console.error("Failed to parse stored post data:", error);
        // 如果解析失敗，清除 localStorage 中的無效資料
        localStorage.removeItem("postData");
      }
    }

    // 如果有存儲的數據，則加載
    if (Object.keys(loadedData).length > 0) {
      setPostData((prev) => ({
        ...prev,
        ...loadedData,
      }));
    }

    hasLoadedFromStorage.current = true;
    setIsInitialized(true);
  }, []); // 空依賴，只執行一次

  async function NewPostAPI() {
    setPostButtonDisable(true);

    if (!data) {
      return;
    }

    if (data?.title === "") {
      return Swal.fire(alertMessageConfigs.titleError).then(() =>
        setPostButtonDisable(false),
      );
    }
    if (!data.sig) {
      return Swal.fire(alertMessageConfigs.sigError).then(() =>
        setPostButtonDisable(false),
      );
    }

    try {
      if (!data || !token) {
        throw new Error("Missing data or token");
      }
      const res = await postAPI(data, token);

      if (res.status === 2000) {
        return Swal.fire(alertMessageConfigs.Success).then(() => {
          setPostButtonDisable(false);
          // ✅ 成功發布後才清除
          localStorage.removeItem("editorContent");
          localStorage.removeItem("postData");
          hasLoadedFromStorage.current = false; // 重置標記
          route.push(`/post/${res.data._id}`);
        });
      }
      if (res.status === 4001) {
        Swal.fire(alertMessageConfigs.PermissionError).then(() =>
          setPostButtonDisable(false),
        );
      } else {
        setPostButtonDisable(false);
        throw new Error("Unexpected error");
      }
    } catch (_error) {
      Swal.fire(alertMessageConfigs.OthersError).then(() =>
        setPostButtonDisable(false),
      );
    }
  }

  function discard(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    Swal.fire({
      title: "確定要放棄嗎？",
      text: "所有未保存的內容將會丟失",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "確定放棄",
      cancelButtonText: "取消",
      confirmButtonColor: "#dc0032",
    }).then((result) => {
      if (result.isConfirmed) {
        setPostData({
          title: "",
          sig: "",
          content: markdownGuide,
          cover: "",
          hashtag: [],
        });
        localStorage.removeItem("editorContent");
        localStorage.removeItem("postData");
        hasLoadedFromStorage.current = false;
      }
    });
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const validImageTypes = [
      "image/webp",
      "image/jpeg",
      "image/png",
      "image/tiff",
    ];

    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    if (!validImageTypes.includes(file.type)) {
      Swal.fire(
        "File type not supported",
        "You can only upload png, jpg, webp, tiff",
        "error",
      );
      return;
    }

    if (file.size > 5 * 1000 * 1000) {
      Swal.fire(
        "File too large",
        "You can only upload files under 5MB",
        "error",
      );
      return;
    }

    try {
      const imageUploadAPIResponse = await imageUpload(file, token);
      const imageUploadResponseJson = await imageUploadAPIResponse.json();
      setPostData(
        (prev: TPostAPI) =>
          ({
            ...prev,
            cover: imageUploadResponseJson.id,
          }) as TPostAPI,
      );
    } catch (error) {
      console.error("error: ", error);
      Swal.fire(
        "Error",
        "Something went wrong. Please try again later",
        "error",
      );
      return;
    }
  }

  if (status === "loading") {
    return <div className="flex h-full items-center justify-center"></div>;
  }

  return isMobile ? (
    <PostEditorMobile
      data={data}
      setPostData={setPostData}
      token={token ?? ""}
      handleFormEventFunction={handleFormChange}
      discardFunction={discard}
      postFunction={NewPostAPI}
      postButtonDisable={postButtonDisable}
      handleFileChange={handleFileChange}
    />
  ) : (
    <PostEditorDesktop
      data={data}
      setPostData={setPostData}
      discardFunction={discard}
      postFunction={NewPostAPI}
      token={token ?? ""}
      handleFormEventFunction={handleFormChange}
      postButtonDisable={postButtonDisable}
      handleFileChange={handleFileChange}
    />
  );
}

"use client";

import { type ChangeEvent, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Desktop Components
import PostEditorDesktop from "@/components/PostEditor/desktop/PostEditor";
// Mobile Components
import PostEditorMobile from "@/components/PostEditor/mobile/PostEditor";
// Types
import type { TPostAPI } from "../../components/PostEditor/types/postAPI";
// Configs
import { alertMessageConfigs } from "../../components/PostEditor/config/alertMessages";
import { markdownGuide } from "../../components/PostEditor/config/markdownGuide";
// APIs Request Function
import { postAPI } from "./(new)/apis/postAPI";
// Utils
import useIsMobile from "@/utils/useIsMobile";
import assert from "assert";
import { useUserAccount } from "@/utils/useUserAccount";
// Modules
import { imageUpload } from "@/modules/imageUploadAPI";

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

  function handleFormChange(e: ChangeEvent<HTMLInputElement>) {
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
    if (!isInitialized || !hasLoadedFromStorage.current) return;

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
    if (hasLoadedFromStorage.current) return;

    const storedContent = localStorage?.getItem("editorContent");
    const storedData = localStorage?.getItem("postData");

    let loadedData: Partial<TPostAPI> = {};

    if (storedContent) {
      loadedData.content = storedContent;
    }

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        loadedData = { ...loadedData, ...parsed };
      } catch (error) {
        console.error("Failed to parse stored post data:", error);
      }
    }

    // 如果有存儲的數據，則加載
    if (Object.keys(loadedData).length > 0) {
      setPostData(prev => ({
        ...prev,
        ...loadedData,
      }));
    }

    hasLoadedFromStorage.current = true;
    setIsInitialized(true);
  }, []); // 空依賴，只執行一次

  async function NewPostAPI() {
    setPostButtonDisable(true);

    if (!data) return;

    if (data?.title === "")
      return Swal.fire(alertMessageConfigs.titleError).then(() =>
        setPostButtonDisable(false),
      );
    if (!data.sig) {
      return Swal.fire(alertMessageConfigs.sigError).then(() =>
        setPostButtonDisable(false),
      );
    }

    try {
      assert(data);
      assert(token !== "");
      const res = await postAPI(data, token!);
      console.debug(res);

      if (res.status === 2000) {
        return Swal.fire(alertMessageConfigs.Success).then(() => {
          setPostButtonDisable(false);
          // ✅ 成功發布後才清除
          localStorage.removeItem("editorContent");
          localStorage.removeItem("postData");
          hasLoadedFromStorage.current = false; // 重置標記
          route.push(`/post/${res.data._id}`);
        });
      } else if (res.status === 4001) {
        Swal.fire(alertMessageConfigs.PermissionError).then(() =>
          setPostButtonDisable(false),
        );
      } else {
        setPostButtonDisable(false);
        throw new Error("Unexpected error");
      }
    } catch (error) {
      Swal.fire(alertMessageConfigs.OthersError).then(() =>
        setPostButtonDisable(false),
      );
    }
  }

  function discard(e: ChangeEvent<HTMLInputElement>) {
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

    if (!e.target.files || e.target.files.length === 0) return;

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
    return <div className="h-full flex items-center justify-center"></div>;
  }

  return isMobile ? (
    <PostEditorMobile
      data={data}
      setPostData={setPostData}
      token={token!}
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
      token={token!}
      handleFormEventFunction={handleFormChange}
      postButtonDisable={postButtonDisable}
      handleFileChange={handleFileChange}
    />
  );
}
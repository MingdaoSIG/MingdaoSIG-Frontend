"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Desktop Components
import PostEditorDesktop from "@/components/PostEditor/desktop/PostEditor";

// Mobile Components
import PostEditorMobile from "@/components/PostEditor/mobile/PostEditor";

// Styles
import styles from "./page.module.scss";

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
  // Form data states
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

  useEffect(() => {
    if (!isInitialized) return; // 初始化前不執行

    if (data.title !== "" || data.sig !== "" || data.hashtag?.length !== 0) {
      localStorage.setItem("postData", JSON.stringify(data));
    } else {
      localStorage.removeItem("postData");
    }
  }, [data, isInitialized]);

  useEffect(() => {
    const storedContent = localStorage?.getItem("editorContent");
    const storedData = localStorage?.getItem("postData");

    if (storedContent) {
      setPostData(
        (prev: TPostAPI | undefined) =>
          ({
            ...prev,
            content: storedContent,
          }) as TPostAPI,
      );
    }
    if (storedData) {
      setPostData(
        (prev: TPostAPI | undefined) =>
          ({
            ...prev,
            ...JSON.parse(storedData),
          }) as TPostAPI,
      );
    }

    setIsInitialized(true); // 標記初始化完成
  }, []);

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
      assert(data); // Check whether data was defined
      assert(token !== ""); // Check whether token was loaded
      const res = await postAPI(data, token!);
      console.debug(res);

      if (res.status === 2000) {
        return Swal.fire(alertMessageConfigs.Success).then(() => {
          setPostButtonDisable(false);
          localStorage.removeItem("editorContent");
          localStorage.removeItem("postData");
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
    setPostData({
      title: "",
      sig: "",
      content: markdownGuide,
      cover: "",
      hashtag: [],
    });
    localStorage.removeItem("editorContent");
    localStorage.removeItem("postData");
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const validImageTypes = [
      "image/webp",
      "image/jpeg",
      "image/png",
      "image/tiff",
    ];

    if (!e.target.files) return;

    const file = e.target.files[0];
    if (!validImageTypes.includes(file.type)) {
      Swal.fire(
        "File type not supported",
        "You can only upload  png,  jpg,  webp, tiff",
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
    return (
      // <div className={styles.loading}>
      //   <h1> Loading...</h1>
      // </div>
      <></>
    );
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
    ></PostEditorMobile>
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
    ></PostEditorDesktop>
  );
}

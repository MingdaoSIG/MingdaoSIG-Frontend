"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Desktop Components
import NewPostDesktop from "./desktop/NewPost";

// Mobile Components
import NewPostMobile from "./mobile/NewPost";

// Styles
import styles from "./page.module.scss";

// Types
import { TPostAPI } from "./types/postAPI";

// Configs
import { popUpMessageConfigs } from "./config/popUpMessage";
import { markdownGuide } from "./config/markdownGuide";

// APIs Request Function
import { postAPI } from "./apis/postAPI";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import assert from "assert";

export default function NewPostPage() {
  const { status } = useSession();
  const route = useRouter();
  const isMobile = useIsMobile();
  // Form data states
  const [token, setToken] = useState<string>(
    localStorage.getItem("UserID") || ""
  );
  const [postData, setPostData] = useState<TPostAPI>({
    title: "",
    sig: "",
    content: markdownGuide,
    cover: "",
  });

  // Adjust form data function
  function handleFormChange(e: ChangeEvent<HTMLInputElement>) {
    setPostData(
      (prev: TPostAPI | undefined) =>
        ({
          ...prev,
          [e.target.name]: e.target.value,
        } as TPostAPI)
    );
  }

  useEffect(() => {
    const storedContent = localStorage?.getItem("editorContent");
    if (storedContent) {
      setPostData(
        (prev: TPostAPI | undefined) =>
          ({
            ...prev,
            content: storedContent,
          } as TPostAPI)
      );
    }
  }, []);

  async function NewPostAPI() {
    if (postData?.title === "")
      return Swal.fire(popUpMessageConfigs.titleError);
    try {
      assert(postData); // Check whether postData is not undefined
      console.debug(postData);
      const res = await postAPI(postData, token);
      console.debug(res);

      if (res.status === 2000) {
        return Swal.fire(popUpMessageConfigs.Success).then(() => {
          localStorage.removeItem("editorContent");
          route.push(`/post/${res.data._id}`);
        });
      } else if (res.status === 4001) {
        Swal.fire(popUpMessageConfigs.PermissionError);
      } else {
        throw new Error("Unexpected error");
      }
    } catch (error) {
      Swal.fire(popUpMessageConfigs.OthersError);
    }
  }

  function discard(e: ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    setPostData({
      title: "",
      sig: "",
      content: markdownGuide,
      cover: "",
    });
    localStorage.removeItem("editorContent");
  }

  if (status === "loading") {
    return (
      <div className={styles.loading}>
        <h1> Loading...</h1>
      </div>
    );
  }

  return isMobile ? (
    <NewPostMobile
      postData={postData}
      setPostData={setPostData}
      token={token}
      handleFormEventFunction={handleFormChange}
      discardFunction={discard}
      postFunction={NewPostAPI}
    ></NewPostMobile>
  ) : (
    <NewPostDesktop
      postData={postData}
      setPostData={setPostData}
      discardFunction={discard}
      postFunction={NewPostAPI}
      token={token}
      handleFormEventFunction={handleFormChange}
    ></NewPostDesktop>
  );
}

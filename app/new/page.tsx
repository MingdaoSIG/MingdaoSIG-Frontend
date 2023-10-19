"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Desktop Components
import NewPostDesktop from "./(new)/desktop/NewPost";

// Mobile Components
import NewPostMobile from "./(new)/mobile/NewPost";

// Styles
import styles from "./page.module.scss";

// Types
import { TPostAPI } from "./(new)/types/postAPI";

// Configs
import { popUpMessageConfigs } from "./(new)/config/popUpMessage";
import { markdownGuide } from "./(new)/config/markdownGuide";

// APIs Request Function
import { postAPI } from "./(new)/apis/postAPI";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import assert from "assert";

export default function NewPostPage() {
  const { status } = useSession();
  const route = useRouter();
  const isMobile = useIsMobile();
  // Form data states
  const [token, setToken] = useState<string>("");
  const [postButtonDisable, setPostButtonDisable] = useState<boolean>(false);
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
    setToken(localStorage.getItem("token") || "");
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
    setPostButtonDisable(true);
    if (postData?.title === "")
      return Swal.fire(popUpMessageConfigs.titleError).then(() =>
        setPostButtonDisable(false)
      );
    if (!postData.sig) {
      return Swal.fire(popUpMessageConfigs.sigError).then(() =>
        setPostButtonDisable(false)
      );
    }
    try {
      setToken(localStorage.getItem("token") || "");
      assert(postData); // Check whether postData was defined
      assert(token !== ""); // Check whether token was loaded
      const res = await postAPI(postData, token);
      console.debug(res);

      if (res.status === 2000) {
        return Swal.fire(popUpMessageConfigs.Success).then(() => {
          setPostButtonDisable(false);
          localStorage.removeItem("editorContent");
          route.push(`/post/${res.data._id}`);
        });
      } else if (res.status === 4001) {
        Swal.fire(popUpMessageConfigs.PermissionError).then(() =>
          setPostButtonDisable(false)
        );
      } else {
        setPostButtonDisable(false);
        throw new Error("Unexpected error");
      }
    } catch (error) {
      Swal.fire(popUpMessageConfigs.OthersError).then(() =>
        setPostButtonDisable(false)
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
      postButtonDisable={postButtonDisable}
    ></NewPostMobile>
  ) : (
    <NewPostDesktop
      postData={postData}
      setPostData={setPostData}
      discardFunction={discard}
      postFunction={NewPostAPI}
      token={token}
      handleFormEventFunction={handleFormChange}
      postButtonDisable={postButtonDisable}
    ></NewPostDesktop>
  );
}

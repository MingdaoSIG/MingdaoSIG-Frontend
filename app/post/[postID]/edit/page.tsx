"use client";

import { ChangeEvent, Fragment, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Desktop Components
import NewPostDesktop from "@/app/post/[postID]/edit/(edit)/desktop/NewPost";

// Mobile Components
import NewPostMobile from "@/app/post/[postID]/edit/(edit)/mobile/NewPost";

// Styles
import styles from "@/app/new/page.module.scss";

// Types
import { TPostAPI } from "@/app/post/[postID]/edit/(edit)/types/postAPI";

// Configs
import { alertMessageConfigs } from "@/app/post/[postID]/edit/(edit)/config/alertMessages";
import { markdownGuide } from "@/app/post/[postID]/edit/(edit)/config/markdownGuide";

// APIs Request Function
import { postPostAPI, getPostAPI } from "@/app/post/[postID]/edit/(edit)/apis/postAPI";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import assert from "assert";

export default function EditPostPage({ params }: { params: { postID: string } }) {
  const { status } = useSession();
  const route = useRouter();
  const isMobile = useIsMobile();
  // Form data states
  const [token, setToken] = useState<string>("");
  const [postButtonDisable, setPostButtonDisable] = useState<boolean>(false);
  const [data, setPostData] = useState<TPostAPI>({
    title: "",
    sig: "",
    content: markdownGuide,
    cover: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      (async () => {
        const { postID } = params;
        const data = await getPostAPI(postID);
        setPostData(data);
      })();
    }
  }, [params, status]);

  if (status === "loading") {
    return (
      <div></div>
    );
  }

  return isMobile ? (
    <></>
    // <NewPostMobile
    //   data={data}
    //   setPostData={setPostData}
    //   token={token}
    //   handleFormEventFunction={handleFormChange}
    //   discardFunction={discard}
    //   postFunction={NewPostAPI}
    //   postButtonDisable={postButtonDisable}
    // ></NewPostMobile>
  ) : (
    <NewPostDesktop
      data={data}
      setPostData={setPostData}
      // discardFunction={discard}
      // postFunction={NewPostAPI}
      token={token}
      // handleFormEventFunction={handleFormChange}
      postButtonDisable={postButtonDisable}
    ></NewPostDesktop>
  );
}

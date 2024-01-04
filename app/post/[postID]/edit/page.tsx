"use client";

import { ChangeEvent, Fragment, use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Desktop Components
import NewPostDesktop from "@/app/post/[postID]/edit/(edit)/desktop/EditPost";

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
import { getPostAPI } from "@/app/post/[postID]/edit/(edit)/apis/postAPI";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
import assert from "assert";

export default function EditPostPage({ params }: { params: { postID: string } }) {
  const { isLogin, token, userData, isLoading } = useUserAccount();
  const route = useRouter();
  const isMobile = useIsMobile();

  const [postButtonDisable, setPostButtonDisable] = useState<boolean>(false);
  const [postData, setPostData] = useState<TPostAPI | null>();

  useEffect(() => {
    if ((!isLoading && !isLogin) || (!isLoading && postData?.user !== userData?._id)) {
      route.push(`/post/${params.postID}`);
    }
  }, [postData, userData, isLoading, isLogin, route, params.postID]);

  useEffect(() => {
    (async () => {
      const { postID } = params;
      const data = await getPostAPI(postID);
      setPostData(data);
    })();
  }, [params, userData]);

  if (isLoading || !postData || !userData || postData?.user !== userData?._id) {
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
      data={postData!}
      // setPostData={setPostData}
      // discardFunction={discard}
      // postFunction={NewPostAPI}
      token={token!}
      // handleFormEventFunction={handleFormChange}
      postButtonDisable={postButtonDisable}
    ></NewPostDesktop>
  );
}

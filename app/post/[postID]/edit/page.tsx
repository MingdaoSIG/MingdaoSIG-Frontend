"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Desktop Components
import PostEditorDesktop from "@/components/PostEditor/desktop/PostEditor";

// Types
import { TThread } from "@/interfaces/Thread";

// APIs Request Function
import {
  getPostAPI,
  editPostAPI,
} from "@/app/post/[postID]/edit/(edit)/apis/postAPI";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
import { TPostAPI } from "@/components/PostEditor/types/postAPI";

export default function EditPostPage({
  params,
}: {
  params: { postID: string };
}) {
  const route = useRouter();
  const isMobile = useIsMobile();
  const { isLogin, token, userData, isLoading } = useUserAccount();

  const [oldPostData, setOldPostData] = useState<TThread>({} as TThread);
  const [currentPostData, setCurrentPostData] = useState<TPostAPI>({
    title: "",
    sig: "",
    content: oldPostData.content,
    cover: "",
  });

  function handleFormChange(e: ChangeEvent<HTMLInputElement>) {
    setCurrentPostData(
      (prev: TPostAPI | undefined) =>
        ({
          ...prev,
          [e.target.name]: e.target.value,
        } as TPostAPI)
    );
  }

  const [editButtonDisable, setEditButtonDisable] = useState<boolean>(false);

  useEffect(() => {
    if (
      (!isLoading && !isLogin) ||
      (!isLoading && oldPostData?.user !== userData?._id)
    ) {
      route.push(`/post/${params.postID}`);
    }
  }, [oldPostData, userData, isLoading, isLogin, route, params.postID]);

  useEffect(() => {
    if (params.postID && currentPostData.content === oldPostData.content) {
      (async () => {
        const { postID } = params;
        const res = await getPostAPI(postID);
        if (res.status !== 2000) {
          route.push("/");
        } else {
          setOldPostData(res.data);
          setCurrentPostData({
            title: res.data.title,
            sig: res.data.sig,
            content: res.data.content,
            cover: res.data.cover,
          });
        }
      })();
    }
  }, [currentPostData.content, oldPostData.content, params, route, userData]);

  useEffect(() => {
    if (oldPostData.content === currentPostData.content) {
      setEditButtonDisable(true);
    } else if (currentPostData.content === "") {
      setEditButtonDisable(true);
    } else {
      setEditButtonDisable(false);
    }
  }, [currentPostData, oldPostData]);

  function undo() {
    setCurrentPostData({
      title: oldPostData.title,
      sig: oldPostData.sig,
      content: oldPostData.content,
      cover: oldPostData.cover,
    });
  }

  function sendEdit() {
    Swal.fire({
      title: "Warning",
      text: "Are you sure to edit this post?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { postID } = params;
        const res = await editPostAPI(currentPostData, postID, token!);
        if (res.status === 2000) {
          Swal.fire({
            title: "Success Edit",
            icon: "success",
            confirmButtonText: "View Post",
          }).then(() => {
            route.push(`/post/${postID}`);
          });
        } else {
          Swal.fire({
            title: "Something Wrong",
            icon: "error",
            confirmButtonText: "Confirm",
          });
        }
      }
    });
  }

  if (
    isLoading ||
    !oldPostData ||
    !userData ||
    oldPostData?.user !== userData?._id
  ) {
    return <div></div>;
  }

  return isMobile ? (
    <></>
  ) : (
    <PostEditorDesktop
      token={token!}
      data={currentPostData}
      setPostData={setCurrentPostData}
      discardFunction={undo}
      postFunction={sendEdit}
      postButtonDisable={editButtonDisable}
      handleFormEventFunction={handleFormChange}
    />
  );
}

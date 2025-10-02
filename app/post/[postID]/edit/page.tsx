"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Desktop Components
import PostEditorDesktop from "@/components/PostEditor/desktop/PostEditor";

// Mobile Components
import PostEditorMobile from "@/components/PostEditor/mobile/PostEditor";

// Types
import type { TThread } from "@/interfaces/Thread";

// APIs Request Function
import {
  getPostAPI,
  editPostAPI,
} from "@/app/post/[postID]/edit/(edit)/apis/postAPI";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
import type { TPostAPI } from "@/components/PostEditor/types/postAPI";

// Modules
import { imageUpload } from "@/modules/imageUploadAPI";

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
    title: oldPostData.title,
    sig: oldPostData.sig,
    content: oldPostData.content,
    cover: oldPostData.cover,
    hashtag: oldPostData.hashtag,
  });

  function handleFormChange(e: ChangeEvent<HTMLInputElement>) {
    setCurrentPostData(
      (prev: TPostAPI | undefined) =>
        ({
          ...prev,
          [e.target.name]: e.target.value,
        }) as TPostAPI,
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
        }
      })();
    }
  }, [currentPostData.content, oldPostData.content, params, route, userData]);

  useEffect(() => {
    if (
      !currentPostData.title ||
      !currentPostData.content ||
      !currentPostData.sig ||
      !currentPostData.cover
    ) {
      setCurrentPostData(
        (prev: TPostAPI) =>
          ({
            ...prev,
            title: oldPostData.title,
            sig: oldPostData.sig,
            content: oldPostData.content,
            cover: oldPostData.cover,
            hashtag: oldPostData.hashtag,
          }) as TPostAPI,
      );
    }
  }, [
    currentPostData.content,
    currentPostData.cover,
    currentPostData.sig,
    currentPostData.title,
    oldPostData.content,
    oldPostData.cover,
    oldPostData.hashtag,
    oldPostData.sig,
    oldPostData.title,
  ]);

  useEffect(() => {
    if (
      oldPostData.content === currentPostData.content &&
      oldPostData.title === currentPostData.title &&
      oldPostData.sig === currentPostData.sig &&
      oldPostData.cover === currentPostData.cover &&
      oldPostData.hashtag?.toString() === currentPostData.hashtag?.toString()
    ) {
      setEditButtonDisable(true);
    } else if (
      currentPostData.content === "" ||
      currentPostData.title === "" ||
      currentPostData.sig === ""
    ) {
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
      hashtag: oldPostData.hashtag,
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
      setCurrentPostData(
        (prev: TPostAPI) =>
          ({
            ...prev,
            cover:
              `${process.env.NEXT_PUBLIC_API_URL}/image/` +
              imageUploadResponseJson.id,
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

  if (isLoading || !userData || oldPostData.user !== userData?._id) {
    return <div></div>;
  }

  return isMobile ? (
    <PostEditorMobile
      token={token!}
      data={currentPostData}
      setPostData={setCurrentPostData}
      discardFunction={undo}
      postFunction={sendEdit}
      postButtonDisable={editButtonDisable}
      handleFormEventFunction={handleFormChange}
      isEdit
    ></PostEditorMobile>
  ) : (
    <PostEditorDesktop
      token={token!}
      data={currentPostData}
      setPostData={setCurrentPostData}
      discardFunction={undo}
      postFunction={sendEdit}
      postButtonDisable={editButtonDisable}
      handleFormEventFunction={handleFormChange}
      handleFileChange={handleFileChange}
      isEdit
    />
  );
}

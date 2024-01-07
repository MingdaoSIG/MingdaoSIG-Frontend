"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Desktop Components
import NewPostDesktop from "@/app/post/[postID]/edit/(edit)/desktop/EditPost";

// Types
import { TThread } from "@/interfaces/Thread";

// APIs Request Function
import { getPostAPI, editPostAPI } from "@/app/post/[postID]/edit/(edit)/apis/postAPI";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";


export default function EditPostPage({ params }: { params: { postID: string } }) {
  const route = useRouter();
  const isMobile = useIsMobile();
  const { isLogin, token, userData, isLoading } = useUserAccount();

  const [oldPostData, setOldPostData] = useState<TThread>({} as TThread);
  const [newPostData, setNewPostData] = useState<TThread>({} as TThread);
  const [editButtonDisable, setEditButtonDisable] = useState<boolean>(false);

  useEffect(() => {
    if ((!isLoading && !isLogin) || (!isLoading && oldPostData?.user !== userData?._id)) {
      route.push(`/post/${params.postID}`);
    }
  }, [oldPostData, userData, isLoading, isLogin, route, params.postID]);

  useEffect(() => {
    if (params.postID) {
      (async () => {
        const { postID } = params;
        const res = await getPostAPI(postID);
        if (res.status !== 2000) {
          route.push("/");
        } else {
          setOldPostData(res.data);
          setNewPostData(res.data);
        }
      })();
    }
  }, [params, route, userData]);

  useEffect(() => {
    if (oldPostData.content === newPostData.content) {
      setEditButtonDisable(true);
    } else if (newPostData.content === "") {
      setEditButtonDisable(true);
    } else {
      setEditButtonDisable(false);
    }
  }, [newPostData, oldPostData]);

  function undo() {
    setNewPostData(oldPostData);
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
        const res = await editPostAPI(newPostData, postID, token!);
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

  if (isLoading || !oldPostData || !userData || oldPostData?.user !== userData?._id) {
    return (
      <div></div>
    );
  }

  return isMobile ? (
    <></>
  ) : (
    <NewPostDesktop
      token={token!}
      oldPostData={oldPostData}
      newPostData={newPostData}
      setNewPostData={setNewPostData}
      undoFunction={undo}
      sendEditFunction={sendEdit}
      editButtonDisable={editButtonDisable}
    />
  );
}

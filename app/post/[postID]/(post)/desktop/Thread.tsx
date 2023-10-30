"use client";

import style from "./Thread.module.scss";

import { IThread } from "@/interfaces/Thread.interface";
import { MdPreview } from "md-editor-rt";

import "md-editor-rt/lib/preview.css";
import "md-editor-rt/lib/style.css";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUserAccount } from "@/utils/useUserAccount";

const Thread = ({ post }: { post: IThread }) => {
  const { isLogin, token, userData, isLoading, login, logout } = useUserAccount();

  const [like, setLike] = useState<any>(false);

  const route = useRouter();

  function onLike() {
    if (localStorage.getItem("token")) {
      setLike(!like);
      if (like) {
        DeleteLike();
      } else {
        PostLike();
      }
    } else {
      Swal.fire({
        title: "Please login first",
        text: "You must login to like someone's post",
        icon: "warning",
        confirmButtonText: "Confirm",
      });
    }
  }

  function onDelete() {
    Swal.fire({
      title: "Are you sure you want to delete this post",
      icon: "question",
      confirmButtonText: "Confirm",
      showCancelButton: true,
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        DeletePost();
        Swal.fire({
          title: "Successfully delete post",
          icon: "success",
          confirmButtonText: "Back to home",
          confirmButtonColor: "#6e7881",
          showDenyButton: true,
          denyButtonText: "Create new post",
          denyButtonColor: "#82D7FF",
        }).then(async (result) => {
          if (result.isConfirmed) {
            route.push("/");
          } else if (result.isDenied) {
            route.push("/new");
          }
        });
      }
    });
  }

  async function DeletePost() {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/post/${post._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  }

  async function PostLike() {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/post/${post._id}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  }
  async function DeleteLike() {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/post/${post._id}/like`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (isLogin) {
      post.like?.includes(userData?._id!) ? setLike(true) : setLike(false);
    }
  }, [isLogin, post.like, userData?._id]);

  if (post?.sig === "652d60b842cdf6a660c2b778") {
    return (
      <>
        <div className="py-[1rem]">
          <div className={style.threadTitle + " " + style.customTitle}>
            <h1 className="my-auto">{post?.title}</h1>
          </div>
          <MdPreview
            modelValue={post?.content}
            className={style.threadContent + " " + style.customThread}
            previewTheme="github"
          />
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className={style.threadTitle + " flex relative"}>
          <h1>{post?.title}</h1>
          {
            (isLogin && post?.user === userData?._id) &&
            [<div
              key="delete"
              className="max-h-[64px] my-auto right-[20px] top-0 bottom-0 flex items-center justify-center cursor-pointer"
              onClick={onDelete}
            >
              <Image src="/icons/delete.svg" width={32} height={32} alt="delete" />
            </div>
            ]
          }
          <div
            className="max-h-[64px] my-auto right-[20px] top-0 bottom-0 flex items-center justify-center cursor-pointer"
            onClick={onLike}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M26.9399 6.38798C26.2047 5.64761 25.3304 5.05985 24.3673 4.65849C23.4042 4.25714 22.3713 4.05012 21.3279 4.04932C19.3543 4.04964 17.4528 4.79101 15.9999 6.12665C14.5471 4.79079 12.6455 4.04938 10.6719 4.04932C9.62728 4.0504 8.59319 4.25806 7.62914 4.66034C6.66509 5.06262 5.79011 5.65158 5.05456 6.39332C1.91723 9.54398 1.91856 14.472 5.05723 17.6093L15.9999 28.552L26.9426 17.6093C30.0812 14.472 30.0826 9.54398 26.9399 6.38798Z"
                fill={like ? "#EE5757" : "#BDBDBD"}
              />
            </svg>
          </div>
        </div>
        <MdPreview
          modelValue={post?.content}
          className={style.threadContent}
          previewTheme="github"
        />
      </>
    );
  }
};

export default Thread;

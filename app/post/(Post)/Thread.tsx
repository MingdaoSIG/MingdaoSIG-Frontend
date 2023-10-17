import { lchownSync } from "fs";
import style from "./Thread.module.scss";

import { IThread } from "@/interface/Thread.interface";
import { MdPreview } from "md-editor-rt";

import "md-editor-rt/lib/preview.css";
import { useEffect, useState } from "react";

const Thread = ({ post }: { post: IThread }) => {
  const [like, setLike] = useState<any>(false);
  const [token, setToken] = useState<string>("");

  function Like() {
    if (localStorage.getItem("UserID")) {
      setLike(!like);
      if (like) {
        DeleteLike();
      } else {
        PostLike();
      }
    }
  }
  async function PostLike() {
    try {
      const res = await fetch(
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
      const res = await fetch(
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
    setToken(localStorage.getItem("UserID") || "");

    if (localStorage.getItem("UserID")) {
      const User: any = JSON.parse(localStorage.getItem("User")?.toString()!);
      if (post.like.includes(User._id)) {
        setLike(true);
      }
    }
  }, [post.like]);

  if (post.sig === "652d60b842cdf6a660c2b778") {
    return (
      <>
        <div>
          <div className={style.threadTitle + " " + style.customTitle}>
            <h1 className="my-auto">{post?.title}</h1>
          </div>
          <MdPreview
            modelValue={post?.content}
            className={style.threadContent + " " + style.customThread}
          />
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className={style.threadTitle + " flex relative"}>
          <h1 className="my-auto pr-4">{post?.title}</h1>
          <div
            className="max-h-[64px] my-auto absolute right-[20px] top-0 bottom-0 flex items-center justify-center cursor-pointer"
            onClick={Like}
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
          codeTheme="github"
          className={style.threadContent}
        />
      </>
    );
  }
};

export default Thread;

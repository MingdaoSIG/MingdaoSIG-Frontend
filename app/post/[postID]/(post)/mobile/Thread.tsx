import { MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/preview.css";
import "md-editor-rt/lib/style.css";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

// Components
import Replies from "./Replies";

// Styles
import styles from "./Thread.module.scss";

// Interfaces
import { IThread } from "@/interfaces/Thread.interface";

const Thread = ({ post }: { post: IThread }) => {
  const [like, setLike] = useState<any>(false);
  const [token, setToken] = useState<string>("");

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
        title: "請先登入",
        text: "你必須登入才可以使用按讚功能",
        icon: "warning",
        confirmButtonText: "確定",
        confirmButtonColor: "#82D7FF",
      });
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
    setToken(localStorage.getItem("token") || "");

    if (localStorage.getItem("token")) {
      const User: any = JSON.parse(localStorage.getItem("user")?.toString()!);
      if (post?.like?.includes(User._id)) {
        setLike(true);
      }
    }
  }, [post?.like]);

  return (
    <div className={styles.thread}>
      <div className={styles.threadTitle}>
        <h1>{post?.title}</h1>
        <div onClick={onLike}>
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
        className={styles.threadContent}
        previewTheme="github"
      />
      <Replies post={post} />
    </div>
  );
};

export default Thread;

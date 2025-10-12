import { MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/preview.css";
import "md-editor-rt/lib/style.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Image from "next/image";

// Components
import Replies from "./Replies";

// Styles
import styles from "./Thread.module.scss";

// Interfaces
import type { TThread } from "@/interfaces/Thread";

// Utils
import { useUserAccount } from "@/utils/useUserAccount";

const Thread = ({
  post,
  isAnnouncement,
}: {
  post: TThread;
  isAnnouncement?: boolean;
}) => {
  const { isLogin, isLoading, token, userData } = useUserAccount();
  const [like, setLike] = useState<any>(false);
  const router = useRouter();

  function onLike() {
    if (!isLoading && !isLogin) {
      Swal.fire({
        title: "Please login first",
        text: "You must login to like someone's post",
        icon: "warning",
        confirmButtonText: "Confirm",
      });
    } else {
      setLike(!like);
      if (like) {
        DeleteLike();
      } else {
        PostLike();
      }
    }
  }

  function onEdit() {
    router.push(`/post/${post._id}/edit`);
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
        },
      );
    } catch (error) {
      console.error(error);
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
        },
      );
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (isLogin) {
      post.like?.includes(userData?._id!) ? setLike(true) : setLike(false);
    }
  }, [isLogin, post.like, userData?._id]);

  if (isAnnouncement) {
    return (
      <div className={styles.thread + " " + styles.threadAnnouncement}>
        <div className={styles.threadTitle}>
          <h1>{post.title}</h1>
        </div>
        <MdPreview
          value={post.content}
          className={styles.threadContent}
          previewTheme="github"
        />
      </div>
    );
  }

  return (
    <div className={styles.thread}>
      <div className={styles.threadTitle}>
        <h1>{post.title}</h1>
        {isLogin && post.user === userData?._id && (
          <div
            key="edit"
            className="max-h-[64px] my-auto right-[20px] top-0 bottom-0 flex items-center justify-center cursor-pointer"
            onClick={onEdit}
          >
            <Image src="/icons/edit.svg" width={32} height={32} alt="delete" />
          </div>
        )}
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
        value={post.content}
        language="en-US"
        className={styles.threadContent}
        previewTheme="github"
      />
      <Replies post={post} />
    </div>
  );
};

export default Thread;

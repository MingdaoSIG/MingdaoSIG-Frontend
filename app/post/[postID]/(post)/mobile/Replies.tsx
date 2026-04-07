// Components

// Module
import Image from "next/image";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

// Interfaces
import type { TComments } from "@/interfaces/comments";
import type { TThread } from "@/interfaces/Thread";
// Utils
import useAlert from "@/utils/useAlert";
import { useUserAccount } from "@/utils/useUserAccount";
// API Request Function
import { GetCommentAPI, PostCommentAPI } from "../apis/CommentAPI";
import Reply from "../components/Reply";
// Config
import { alertMessageConfigs } from "../configs/alertMessages";
// Styles
import styles from "./Replies.module.scss";

export default function Replies({ post }: { post: TThread }) {
  const [typeComments, setTypeComments] = useState<string>("");
  const [typeText, setTypeText] = useState(false);
  const [comments, setComments] = useState<TComments[]>([]);
  const [extended, setExtended] = useState(false);
  const { token, isLogin } = useUserAccount();
  const { showAlert } = useAlert();

  async function handleCommandSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLogin) {
      return showAlert(alertMessageConfigs.noLogin);
    }
    const reply = "";
    const content = typeComments;
    if (typeComments.length === 0) {
      return showAlert(alertMessageConfigs.noComment);
    }
    try {
      const res = await PostCommentAPI(post?._id, reply, content, token);
      if (res.status === 2000) {
        setTypeComments("");
        showAlert(alertMessageConfigs.commentSuccess).then(async () => {
          await GetCommentAPI(post).then((res) => {
            setComments(res.data);
          });
        });
      }
    } catch (_e) {
      Swal.fire(alertMessageConfigs.otherError);
    }
  }

  async function handleCloseExtended(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (
      !(
        target instanceof HTMLInputElement ||
        target.id === "send" ||
        target.id === "customId"
      )
    ) {
      setExtended(false);
    }
  }

  useEffect(() => {
    GetCommentAPI(post).then((res) => {
      if (res.data.length === 0) {
        return;
      }
      setComments(res.data);
    });
  }, [post]);

  return (
    <div
      className={
        styles.wrapper + (extended ? "!bg-white h-[70dvh]" : "h-[6.5rem]")
      }
      onClick={() => {
        if (!extended) {
          setExtended(true);
        }
      }}
    >
      <div
        className={styles.repliesWrapper + (extended ? "h-full" : "h-auto")}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          if (extended) {
            handleCloseExtended(e);
          }
        }}
      >
        <div className={styles.title}>
          <h4>Comments</h4>
          <span>-</span>
          <p>{comments.length}</p>
        </div>
        <div className={styles.replyList + (extended ? "m-0 h-full" : " ")}>
          {comments.map((comment: TComments, index: number) => {
            if (extended) {
              return (
                <div key={comment._id ?? `comment-${index}`}>
                  <Reply
                    customId={comment.user.customId}
                    avatar={comment.user.avatar}
                    content={comment.content}
                    createdAt={
                      new Date(comments[0].createdAt || "")
                        .toLocaleString("zh-TW")
                        .split(" ")[0]
                    }
                    overflow={false}
                  />
                </div>
              );
            }
            return null;
          })}
          {comments.length > 0 && !extended ? (
            <Reply
              customId={comments[0].user.customId}
              avatar={comments[0].user.avatar}
              content={comments[0].content}
              createdAt={
                new Date(comments[0].createdAt || "")
                  .toLocaleString("zh-TW")
                  .split(" ")[0]
              }
              overflow={false}
              first={true}
            />
          ) : (
            !extended &&
            comments.length === 0 && (
              <p className="mx-auto my-auto font-medium text-[1rem]">
                No comments
              </p>
            )
          )}
        </div>
        <form
          className={
            "bottom-5 mt-5 flex h-[42px] w-full flex-none rounded-full border border-[#BDBDBD] bg-[#D5E5E8] pl-[12px]" +
            (extended ? "" : "hidden")
          }
          onSubmit={handleCommandSubmit}
        >
          <input
            className="h-full w-full flex-1 bg-transparent px-3 focus-visible:outline-none disabled:cursor-not-allowed"
            placeholder="Reply..."
            onChange={(e) => {
              e.target.value.length > 0
                ? setTypeText(true)
                : setTypeText(false);
              setTypeComments(e.target.value);
            }}
            value={typeComments}
            // disabled
          />
          <button type="button" className="h-full w-[40px] flex-none">
            <Image
              src={"/icons/bx-send.svg"}
              height={24}
              width={24}
              alt="send"
              className={
                "mt-auto h-full" +
                (typeText && isLogin
                  ? "cursor-pointer opacity-100"
                  : "cursor-not-allowed opacity-30")
              }
              id="send"
            />
          </button>
        </form>
      </div>
    </div>
  );
}

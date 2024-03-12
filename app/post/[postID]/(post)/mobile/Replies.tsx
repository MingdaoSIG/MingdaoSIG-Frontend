// Components
import { useEffect, useState } from "react";
import Reply from "../components/Reply";

// Styles
import styles from "./Replies.module.scss";

// Interfaces
import { TThread } from "@/interfaces/Thread";

// API Request Function
import { PostCommentAPI, GetCommentAPI } from "../apis/CommentAPI";

// Utils
import useAlert from "@/utils/useAlert";
import { useUserAccount } from "@/utils/useUserAccount";

// Module
import Image from "next/image";
import Swal from "sweetalert2";

// Config
import { alertMessageConfigs } from "../configs/alertMessages";

export default function Replies({ post }: { post: TThread }) {
  const [typeComments, setTypeComments] = useState<string>("");
  const [typeText, setTypeText] = useState(false);
  const [comments, setComments] = useState<any>([]);
  const [extended, setExtended] = useState(false);
  const { token, isLogin } = useUserAccount();
  const { showAlert } = useAlert();

  async function handleCommandSubmit(e: any) {
    e.preventDefault();
    if (!isLogin) return showAlert(alertMessageConfigs.noLogin);
    const reply = "";
    const content = typeComments;
    if (typeComments.length === 0)
      return showAlert(alertMessageConfigs.noComment);
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
    } catch (e) {
      Swal.fire(alertMessageConfigs.otherError);
    }
  }

  async function handleCloseExtended(e: any) {
    if (!(e.target instanceof HTMLInputElement || e.target.id === "send" || e.target.id === "customId")) {
      setExtended(false);
    }
  }

  useEffect(() => {
    GetCommentAPI(post).then((res) => {
      if (res.data.length === 0) return;
      setComments(res.data);
    });
  }, [post]);

  return (
    <div
      className={styles.wrapper + (extended ? " h-[65dvh] !bg-white" : " h-[6.5rem]")}
      onClick={() => {
        if (!extended) setExtended(true);
      }}>
      <div
        className={styles.repliesWrapper + (extended ? " h-full" : " h-auto")}
        onClick={(e: any) => {
          if (extended) handleCloseExtended(e);
        }}
      >
        <div className={styles.title}>
          <h4>Comments</h4>
          <span>-</span>
          <p>{comments.length}</p>
        </div>
        <div className={styles.replyList + (extended ? " h-full m-0" : " ")}>
          {comments.map((comment: any, index: number) => {
            if (extended) {
              return (
                <div key={index}>
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
          })}
          {
            (comments.length > 0 && !extended) ?
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
              :
              (!extended && comments.length === 0) &&
              <p className="mx-auto font-medium text-[1rem] my-auto">No comments</p>
          }
        </div>
        <form
          className={"h-[42px] w-full flex-none bg-[#D5E5E8] rounded-full mt-5 border border-[#BDBDBD] pl-[12px] flex bottom-5 " + (extended ? "" : "hidden")}
          onSubmit={handleCommandSubmit}
        >
          <input
            className="focus-visible:outline-none px-3 w-full h-full bg-transparent flex-1 disabled:cursor-not-allowed"
            placeholder="Reply..."
            onChange={(e) => {
              e.target.value.length > 0 ? setTypeText(true) : setTypeText(false);
              setTypeComments(e.target.value);
            }}
            value={typeComments}
          // disabled
          />
          <button className="h-full w-[40px] flex-none">
            <Image
              src={"/icons/bx-send.svg"}
              height={24}
              width={24}
              alt="send"
              className={
                "mt-auto h-full " +
                (typeText && isLogin
                  ? "opacity-100 cursor-pointer"
                  : "opacity-30 cursor-not-allowed")
              }
              id="send"
            />
          </button>
        </form>
      </div>
    </div>
  );
}

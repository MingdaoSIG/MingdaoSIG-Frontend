// Components
import { useEffect, useState } from "react";
import Reply from "../components/Reply";

// Styles
import styles from "./Replies.module.scss";

// Interfaces
import { IThread } from "@/interfaces/Thread.interface";

// API Request Function
import { GetCommentAPI } from "../apis/CommentAPI";

export default function Replies({ post }: { post: IThread }) {
  const [extend, setExtend] = useState(false);
  const [comments, setComments] = useState<any>([]);
  const [token, setToken] = useState<string>("");

  const handleCommentClick = () => {
    setExtend(!extend);
  };

  useEffect(() => {
    GetCommentAPI(post).then((res) => {
      setComments(res.data);
    });
  });

  return (
    <div
      className={styles.replies}
      style={
        extend ? { height: "60dvh", background: "white" } : { height: "6.5rem" }
      }
      onClick={handleCommentClick}
    >
      <div className={styles.repliesWrapper}>
        <div className={styles.title}>
          <h4>Comments</h4>
          <p>{comments.length}</p>
        </div>
        {!extend ? (
          <div className={styles.firstReply}>
            {comments[0] ? (
              <Reply
                customId={comments[0].user.customId}
                avatar={comments[0].user.avatar}
                content={comments[0].content}
                createdAt={comments[0].createdAt}
                overflow={true}
              ></Reply>
            ) : (
              ""
            )}
          </div>
        ) : (
          <div className={styles.replyList}>
            {comments?.map((comment: any, index: number) => {
              return (
                <div className={styles.reply} key={index}>
                  <Reply
                    customId={comment.user.customId}
                    avatar={comment.user.avatar}
                    content={comment.content}
                    createdAt={new Date(comments[0].createdAt || "").toLocaleString(
                      "zh-TW"
                    ).split(" ")[0]}
                    overflow={false}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Components
import { useEffect, useState } from "react";
import Reply from "../components/Reply";

// Styles
import styles from "./Replies.module.scss";

// Interfaces
import { IThread } from "@/interfaces/Thread.interface";

// API Request Function
import { GetCommentAPI } from "../apis/CommentAPI";
import ClickExtend from "@/app/(Layout)/mobile/ClickExtend";

export default function Replies({ post }: { post: IThread }) {
  const extendedState = useState(false);
  const [extended] = extendedState;
  const [comments, setComments] = useState<any>([]);

  useEffect(() => {
    GetCommentAPI(post).then((res) => {
      setComments(res.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ClickExtend
      heightBefore={"6.5rem"}
      heightAfter={"65dvh"}
      extendedState={extendedState}
      customStyles={{
        backgroundColor: extended ? "white" : ""
      }}
    >
      <div
        className={styles.repliesWrapper}
        style={{
          overflowY: extended ? "auto" : "hidden",
        }}>
        <div className={styles.title}>
          <h4>Comments</h4>
          <p>{comments.length}</p>
        </div>
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
      </div>
    </ClickExtend>
  );
}

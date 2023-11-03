// Components
import { useEffect, useState } from "react";
import Reply from "../components/Reply";

// Styles
import styles from "./Replies.module.scss";

// Interfaces
import { IThread } from "@/interfaces/Thread.interface";

// Types
import { TComments } from "@/interfaces/comments";

// API Request Function
import ClickExtend from "@/app/(Layout)/mobile/ClickExtend";

// Utils
import { useFetch } from "@/utils/useFetch";

export default function Replies({ post }: { post: IThread }) {
  const extendedState = useState(false);
  const [extended] = extendedState;
  const [data, error, isLoading] =
    useFetch<Array<TComments>>(`/comment/list/post/${post._id}`) || [];

  console.info(data);

  return (
    <ClickExtend
      heightBefore={"6.5rem"}
      heightAfter={"65dvh"}
      extendedState={extendedState}
      customStyles={{
        backgroundColor: extended ? "white" : "",
      }}
    >
      <div
        className={styles.repliesWrapper}
        style={{
          overflowY: extended ? "auto" : "hidden",
        }}
      >
        <div className={styles.title}>
          <h4>Comments</h4>
          <p>{data?.length}</p>
        </div>
        {isLoading ? (
          <>Loading...</>
        ) : (
          <div className={styles.replyList}>
            {data?.map((comment: any, index: number) => {
              return (
                <div className={styles.reply} key={index}>
                  <Reply
                    customId={comment.user.customId}
                    avatar={comment.user.avatar}
                    content={comment.content}
                    createdAt={
                      new Date(data[0].createdAt || "")
                        .toLocaleString("zh-TW")
                        .split(" ")[0]
                    }
                    overflow={false}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ClickExtend>
  );
}

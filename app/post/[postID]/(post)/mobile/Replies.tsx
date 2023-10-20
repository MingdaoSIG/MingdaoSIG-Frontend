// Components
import { useState } from "react";
import Reply from "../components/Reply";

// Styles
import styles from "./Replies.module.scss";

export default function Replies() {
  const [extend, setExtend] = useState(false);

  const handleCommentClick = () => {
    setExtend(!extend);
  };

  return (
    <div
      className={styles.replies}
      style={
        extend ? { height: "60dvh", background: "white" } : { height: "93px" }
      }
      onClick={handleCommentClick}
    >
      <div className={styles.title}>
        <h4>Comments</h4>
        <p>0</p>
      </div>
      {!extend ? (
        <div className={styles.firstReply}>
          <Reply></Reply>
        </div>
      ) : (
        <div className={styles.replyList}>
          <div className={styles.reply}>
            <Reply></Reply>
          </div>
          <div className={styles.reply}>
            <Reply></Reply>
          </div>
          <div className={styles.reply}>
            <Reply></Reply>
          </div>
        </div>
      )}
    </div>
  );
}

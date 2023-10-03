import style from "./Thread.module.scss";

import { IThread } from "@/interface/Thread.interface";

const Thread = ({ post }: { post: IThread }) => {
  return (
    <div className={style.Thread}>
      <h1>{post?.title}</h1>
      <p>{post?.content}</p>
    </div>
  );
};

export default Thread;

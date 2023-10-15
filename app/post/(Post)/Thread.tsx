import style from "./Thread.module.scss";

import { IThread } from "@/interface/Thread.interface";
import { MdPreview } from "md-editor-rt";

import "md-editor-rt/lib/preview.css";

const Thread = ({ post }: { post: IThread }) => {
  return (
    <>
      <div className={style.threadTitle}>
        <h1 className="my-auto">{post?.title}</h1>
      </div>
      <MdPreview modelValue={post?.content} className={style.threadContent} />
    </>
  );
};

export default Thread;

import style from "./Thread.module.scss";

import { IThread } from "@/interface/Thread.interface";
import { MdPreview } from "md-editor-rt";

import "md-editor-rt/lib/preview.css";

const Thread = ({ post }: { post: IThread }) => {
  if (post._id === "652cabdb45c0be8f82c54d9a") {
    return (
      <>
        <div>
          <div className={style.threadTitle + " " + style.customTitle}>
            <h1 className="my-auto">{post?.title}</h1>
          </div>
          <MdPreview
            modelValue={post?.content}
            className={style.threadContent + " " + style.customThread}
          />
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className={style.threadTitle}>
          <h1 className="my-auto">{post?.title}</h1>
        </div>
        <MdPreview
          modelValue={post?.content}
          codeTheme="github"
          className={style.threadContent}
        />
      </>
    );
  }
};

export default Thread;

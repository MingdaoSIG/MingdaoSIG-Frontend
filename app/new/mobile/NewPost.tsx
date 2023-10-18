import { Dispatch, SetStateAction } from "react";
import dynamic from "next/dynamic";

// Components
import MetaDataForm from "./MetaDataForm";

// styles
import styles from "./NewPost.module.scss";

// Types
import { TPostAPI } from "../types/postAPI";

interface Props {
  postData: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
  discardFunction: Function;
  handleFormEventFunction: Function;
  postFunction: Function;
}

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
});
export default function NewPostMobile({
  setPostData,
  postData,
  token,
  discardFunction,
  handleFormEventFunction,
  postFunction,
}: Props) {
  return (
    <div className={styles.newPost}>
      <MetaDataForm></MetaDataForm>
      <Editor
        setPostData={setPostData}
        postData={postData}
        token={token}
      ></Editor>
    </div>
  );
}

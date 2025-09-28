import type { Dispatch, SetStateAction } from "react";
import dynamic from "next/dynamic";

// styles
import styles from "./NewPost.module.scss";

// Components
import MetaDataForm from "./MetaDataForm";
import Button from "./Buttons";

// Types
import type { TPostAPI } from "../types/postAPI";

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
  discardFunction: Function;
  handleFormEventFunction: Function;
  postFunction: Function;
  postButtonDisable: boolean;
  isEdit?: boolean;
}

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
});
export default function NewPostMobile({
  setPostData,
  data,
  token,
  discardFunction,
  handleFormEventFunction,
  postFunction,
  postButtonDisable,
  isEdit,
}: Props) {
  return (
    <div className={styles.newPost}>
      <MetaDataForm
        data={data}
        handleFormEventFunction={handleFormEventFunction}
      ></MetaDataForm>
      <div className="h-full">
        <Editor setPostData={setPostData} data={data} token={token}></Editor>
      </div>
      <Button
        discardFunction={discardFunction}
        postFunction={postFunction}
        postButtonDisable={postButtonDisable}
        isEdit={isEdit}
      ></Button>
    </div>
  );
}

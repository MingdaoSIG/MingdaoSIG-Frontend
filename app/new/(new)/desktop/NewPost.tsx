import { Suspense, Dispatch, SetStateAction } from "react";
import dynamic from "next/dynamic";

// Style
import styles from "./NewPost.module.scss";

// Components
import SplitBlock from "@/app/(Layout)/splitBlock";
import MetaDataForm from "./MetaDataForm";

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
export default function NewPost({
  postData,
  setPostData,
  token,
  discardFunction,
  handleFormEventFunction,
  postFunction,
}: Props) {
  return (
    <SplitBlock>
      <Suspense fallback={null}>
        <Editor
          setPostData={setPostData}
          postData={postData}
          token={token}
        ></Editor>
      </Suspense>
      <MetaDataForm
        discardFunction={discardFunction}
        postFunction={postFunction}
        postData={postData}
        handleFormEventFunction={handleFormEventFunction}
      />
    </SplitBlock>
  );
}

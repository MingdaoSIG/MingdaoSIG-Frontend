import { Suspense, Dispatch, SetStateAction } from "react";
import dynamic from "next/dynamic";

// Style
import styles from "./NewPost.module.scss";

// Components
import SplitBlock from "@/app/(Layout)/splitBlock";
import MetaDataForm from "./MetaDataForm";

// Types
import { TThread } from "@/interfaces/Thread";

interface Props {
  data: TThread;
  // setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
  // discardFunction: Function;
  // handleFormEventFunction: Function;
  // postFunction: Function;
  // postButtonDisable: boolean;
}

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
});

export default function NewPost({
  data,
  // setPostData,
  token,
  // discardFunction,
  // handleFormEventFunction,
  // postFunction,
  // postButtonDisable,
}: Props) {
  return (
    <SplitBlock>
      <Suspense fallback={null}>
        <Editor
          // setPostData={setPostData}
          data={data}
          token={token}
        />
      </Suspense>
      {/* <MetaDataForm
        discardFunction={discardFunction}
        postFunction={postFunction}
        data={data}
        handleFormEventFunction={handleFormEventFunction}
        postButtonDisable={postButtonDisable}
      /> */}
    </SplitBlock>
  );
}

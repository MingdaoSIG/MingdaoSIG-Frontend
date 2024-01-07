import { Suspense, Dispatch, SetStateAction } from "react";
import dynamic from "next/dynamic";

// Components
import SplitBlock from "@/app/(Layout)/splitBlock";
import MetaDataForm from "./MetaDataForm";

// Types
import { TThread } from "@/interfaces/Thread";

interface Props {
  token: string;
  oldPostData: TThread;
  newPostData: TThread;
  setNewPostData: Dispatch<SetStateAction<TThread>>;
  undoFunction: Function;
  sendEditFunction: Function;
  editButtonDisable: boolean;
}

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
});

export default function NewPost({
  token,
  oldPostData,
  newPostData,
  setNewPostData,
  undoFunction,
  sendEditFunction,
  editButtonDisable,
}: Props) {
  return (
    <SplitBlock>
      <Suspense fallback={null}>
        <Editor
          token={token}
          newPostData={newPostData}
          setNewPostData={setNewPostData}
        />
      </Suspense>
      <MetaDataForm
        oldPostData={oldPostData}
        undoFunction={undoFunction}
        sendEditFunction={sendEditFunction}
        editButtonDisable={editButtonDisable}
      />
    </SplitBlock>
  );
}

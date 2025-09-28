import { Suspense, type Dispatch, type SetStateAction } from "react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Style
import styles from "./NewPost.module.scss";

// Components
import SplitBlock from "@/app/(Layout)/splitBlockNew";
import MetaDataForm from "./MetaDataForm";

// Types
import type { TPostAPI } from "../types/postAPI";
import TitleSigForm from "./TitleSigForm";

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
  discardFunction: Function;
  handleFormEventFunction: Function;
  postFunction: Function;
  postButtonDisable: boolean;
  handleFileChange?: Function;
  isEdit?: boolean;
}

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
});
export default function NewPost({
  data,
  setPostData,
  token,
  discardFunction,
  handleFormEventFunction,
  postFunction,
  postButtonDisable,
  handleFileChange,
  isEdit,
}: Props) {
  const [hashtag, setHashtag] = useState<string[]>([]);

  useEffect(() => {
    if (data.hashtag) {
      const tags = data.hashtag.map((tag) => tag.replace("#", ""));
      setHashtag(tags);
    }
  }, [data]);

  function handleAddTag(tag: string) {
    if (tag === "" || tag.length > 20) return;
    if (!hashtag.includes(tag)) {
      const newTags = [...hashtag, tag];
      setHashtag(newTags);
      setPostData((prev) => ({ ...prev, hashtag: newTags }));
    }
  }

  function handleRemoveTag(tag: string) {
    const newTags = hashtag.filter((t) => t !== tag);
    setHashtag(newTags);
    setPostData((prev) => ({ ...prev, hashtag: newTags }));
  }

  return (
    <SplitBlock>
      <Suspense fallback={null}>
        <TitleSigForm setPostData={setPostData} data={data} handleFormEventFunction={handleFormEventFunction} />
        <Editor setPostData={setPostData} data={data} token={token} />
      </Suspense>
      <MetaDataForm
        discardFunction={discardFunction}
        postFunction={postFunction}
        data={data}
        handleFormEventFunction={handleFormEventFunction}
        postButtonDisable={postButtonDisable}
        handleFileChange={handleFileChange}
        isEdit={isEdit}
      />
    </SplitBlock>
  );
}

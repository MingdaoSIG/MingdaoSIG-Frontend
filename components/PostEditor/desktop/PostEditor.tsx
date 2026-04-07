"use client";

import dynamic from "next/dynamic";
import {
  type Dispatch,
  type SetStateAction,
  Suspense,
  useEffect,
  useState,
} from "react";

// Components
import SplitBlock from "@/app/(Layout)/splitBlockNew";
// Types
import type { TPostAPI } from "../types/postAPI";
import MetaDataForm from "./MetaDataForm";
import TitleSigForm from "./TitleSigForm";

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
  discardFunction: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleFormEventFunction: (e: {
    target: { name: string; value: string | string[] };
  }) => void;
  postFunction: () => void;
  postButtonDisable: boolean;
  handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEdit?: boolean;
}

const Editor = dynamic(() => import("./Editor"), { ssr: false });

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
  const [_hashtag, setHashtag] = useState<string[]>([]);

  useEffect(() => {
    if (data.hashtag) {
      const tags = data.hashtag.map((tag) => tag.replace("#", ""));
      setHashtag(tags);
    }
  }, [data]);

  return (
    <SplitBlock>
      <Suspense fallback={null}>
        <TitleSigForm
          data={data}
          handleFormEventFunction={handleFormEventFunction}
        />
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

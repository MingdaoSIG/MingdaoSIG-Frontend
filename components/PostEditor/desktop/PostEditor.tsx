"use client";

import dynamic from "next/dynamic";
import {
  type Dispatch,
  type SetStateAction,
  Suspense,
  useEffect,
  useState,
} from "react";

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

  // App-mode workspace: fills the shell row between header and dock
  return (
    <div className="mx-auto grid h-full min-h-0 w-[min(80rem,100%-4rem)] grid-cols-[minmax(0,1fr)_20rem] gap-6">
      <div className="flex min-h-0 flex-col">
        <Suspense fallback={null}>
          <TitleSigForm
            data={data}
            handleFormEventFunction={handleFormEventFunction}
          />
          <div className="min-h-0 flex-1">
            <Editor setPostData={setPostData} data={data} token={token} />
          </div>
        </Suspense>
      </div>
      <MetaDataForm
        discardFunction={discardFunction}
        postFunction={postFunction}
        data={data}
        handleFormEventFunction={handleFormEventFunction}
        postButtonDisable={postButtonDisable}
        handleFileChange={handleFileChange}
        isEdit={isEdit}
      />
    </div>
  );
}

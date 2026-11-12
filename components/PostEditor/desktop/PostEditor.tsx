"use client";

import dynamic from "next/dynamic";
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  Suspense,
  useEffect,
  useState,
} from "react";

// Types
import { EditorErrorBoundary } from "../shared/EditorErrorBoundary";
import { LoginBanner } from "../shared/LoginBanner";
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
  /** Edit mode: the SIG the post is already in. */
  originalSig?: string;
  /** Above the editor: cloud-draft status, drafts list, notices. */
  topBar?: ReactNode;
  /** In the side card under 標籤 (「加入系列」). */
  metaExtra?: ReactNode;
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
  originalSig,
  topBar,
  metaExtra,
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
    <div className="mx-auto flex h-full min-h-0 w-[min(80rem,100%-4rem)] flex-col gap-3">
      {!isEdit && <LoginBanner className="shrink-0" />}
      {topBar && <div className="flex shrink-0 flex-col gap-2">{topBar}</div>}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_20rem] gap-6">
        <div className="flex min-h-0 flex-col">
          <Suspense fallback={null}>
            <TitleSigForm
              data={data}
              handleFormEventFunction={handleFormEventFunction}
              originalSig={originalSig}
            />
            <div className="min-h-0 flex-1">
              <EditorErrorBoundary data={data} setPostData={setPostData}>
                <Editor setPostData={setPostData} data={data} token={token} />
              </EditorErrorBoundary>
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
          extra={metaExtra}
        />
      </div>
    </div>
  );
}

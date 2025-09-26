import { Suspense, Dispatch, SetStateAction } from "react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Style
import styles from "./NewPost.module.scss";

// Components
import SplitBlock from "@/app/(Layout)/splitBlock";
import MetaDataForm from "./MetaDataForm";

// Types
import { TPostAPI } from "../types/postAPI";

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
        <div className="w-full mb-2 h-10 bg-white flex items-center px-2 py-2 rounded-full">
          {/* 顯示現有標籤的區域 */}
          <div className="flex gap-1 overflow-x-auto remove-scrollbar rounded-full flex-1">
            {hashtag && hashtag.map((tag, index) => (
              <button
                key={`${tag}-${index}`}
                className="bg-[#5FCDF5] text-white text-sm h-full font-medium px-2.5 py-0.5 rounded-full flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveTag(tag);
                }}
              >
                <span className="flex items-center">
                  <span>#{tag}</span>
                  <span className="ml-2">X</span>
                </span>
              </button>
            ))}
          </div>

          {/* 輸入區域 */}
          <form className="flex items-center flex-initial ml-2 w-[15rem] border-l-black/50 border-l">
            <input
              className="py-1 flex-1 px-2 outline-none w-[5rem]"
              placeholder="Add a tag"
              maxLength={20}
              minLength={1}
            />
            <button
              className="bg-[#5fcdfd] text-white text-sm font-medium rounded-full px-3 py-1 whitespace-nowrap"
              onClick={(e) => {
                e.preventDefault();
                const input = (e.target as HTMLElement).closest("form")?.querySelector("input");
                if (input) {
                  handleAddTag(input.value.trim().replace("#", ""));
                  input.value = "";
                }
              }}
            >
              Add Tag
            </button>
          </form>
        </div>
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
    </SplitBlock >
  );
}

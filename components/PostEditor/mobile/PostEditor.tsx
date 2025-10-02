import type { Dispatch, SetStateAction } from "react";
import dynamic from "next/dynamic";

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
    <div className="pt-[4.5rem] px-2 pb-[4.5rem] h-[100dvh]">
      <div className="bg-white h-full rounded-lg p-4 pr-2 overflow-hidden">
        <div className="flex flex-col items-center overflow-y-auto small-scrollbar h-full pr-2">
          <MetaDataForm
            data={data}
            handleFormEventFunction={handleFormEventFunction}
          />
          <h2 className="text-left w-full h-auto mt-4 mb-1 text-lg">Content</h2>
          <hr className="border-gray-300 h-1 w-full" />
          <div className="h-auto w-full mb-2 mt-2">
            <Editor setPostData={setPostData} data={data} token={token} />
          </div>
          <Button
            discardFunction={discardFunction}
            postFunction={postFunction}
            postButtonDisable={postButtonDisable}
            isEdit={isEdit}
          />
        </div>
      </div>
    </div>
  );
}

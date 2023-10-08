import SplitBlock from "../(Layout)/splitBlock";
import MetaDataForm from "./(New)/MetaDataForm";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Editor = dynamic(() => import("./(New)/Editor"), { ssr: false });

const NewPostPage = () => {
  return (
    <SplitBlock>
      <Suspense fallback={null}>
        <Editor />
      </Suspense>
      <MetaDataForm />
    </SplitBlock>
  );
};

export default NewPostPage;

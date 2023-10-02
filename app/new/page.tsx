import SplitBlock from "../(Layout)/splitBlock";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Editor = dynamic(() => import("./(New)/Editor"), { ssr: false });

const NewPostPage = () => {
  return (
    <SplitBlock>
      <div>
        <Suspense fallback={null}>
          <Editor markdown={`123`} />
        </Suspense>
      </div>
      <div></div>
    </SplitBlock>
  );
};

export default NewPostPage;

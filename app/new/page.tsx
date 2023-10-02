import SplitBlock from "../(Layout)/splitBlock";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Editor = dynamic(() => import("./(New)/Editor"), { ssr: false });

const markdown = `
# Hello world!
Check the EditorComponent.tsx file for the code .
`;

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

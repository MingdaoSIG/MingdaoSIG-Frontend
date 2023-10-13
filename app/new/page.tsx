"use client";

import SplitBlock from "../(Layout)/splitBlock";
import React, { useState, useEffect } from "react";
import MetaDataForm from "./(New)/MetaDataForm";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Editor = dynamic(() => import("./(New)/Editor"), { ssr: false });

const MarkdownGuide = `
# Welcome to MDSIG Post Editor
If you're unfamiliar with Markdown, please refer to this [tutorial](https://www.markdownguide.org/).

# 歡迎使用 MDSIG 文章編輯器
如果您對於 Markdown 不熟悉，請參考這個 [教學](https://www.markdownguide.org/).
`;

export default function NewPostPage() {
  const [editorContent, setEditorContent] = useState<string>(MarkdownGuide);
  useEffect(() => {
    const storedContent = localStorage.getItem("editorContent");
    if (storedContent) {
      setEditorContent(storedContent);
    }
  }, []);

  function discard() {
    setEditorContent(MarkdownGuide);
    ClearLocalStorage();
  }

  return (
    <SplitBlock>
      <Suspense fallback={null}>
        <Editor setFunction={setEditorContent} editorContent={editorContent} />
      </Suspense>
      <MetaDataForm discard={discard} />
    </SplitBlock>
  );
}

function ClearLocalStorage() {
  localStorage.removeItem("editorContent");
}

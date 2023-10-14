"use client";

import SplitBlock from "../(Layout)/splitBlock";
import React, { useState, useEffect } from "react";
import MetaDataForm from "./(New)/MetaDataForm";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import Swal from "sweetalert2";
import { useSession } from "next-auth/react";

const Editor = dynamic(() => import("./(New)/Editor"), { ssr: false });

const MarkdownGuide = `
# Welcome to MDSIG Post Editor
If you're unfamiliar with Markdown, please refer to this [tutorial](https://www.markdownguide.org/).

# 歡迎使用 MDSIG 文章編輯器
如果您對於 Markdown 不熟悉，請參考這個 [教學](https://www.markdownguide.org/).
`;

export default function NewPostPage() {
  const { status } = useSession();
  const [editorContent, setEditorContent] = useState<string>(MarkdownGuide);
  useEffect(() => {
    const storedContent = localStorage.getItem("editorContent");
    if (storedContent) {
      setEditorContent(storedContent);
    }
  }, []);

  async function NewPostAPI(e: any) {
    try {
      if (e.target[0].value === "")
        return Swal.fire({
          title: "Error!",
          text: "No title!",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#ff0000",
        });

      const title = e.target[0].value || "無標題文章";
      const sig = e.target[1].value;
      const hashtag = e.target[2].value || "";
      const content = editorContent;
      const cover = "https://lazco.dev/sig-photo-coming-soon-picture";
      const token = localStorage.getItem("UserID");

      const res = await (
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/post`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title,
            sig: sig,
            hashtag: hashtag,
            content: content,
            cover: cover,
          }),
        })
      ).json();
      console.log(res);
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Something went wrong. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ff0000",
      });
    }
  }

  function discard(e: any) {
    e.preventDefault();
    setEditorContent(MarkdownGuide);
    localStorage.removeItem("editorContent");
  }

  function post(e: any) {
    e.preventDefault();
    NewPostAPI(e);
  }
  if (status === "loading") {
    return (
      <div className="flex flex-col m-auto">
        <h1 className="text-[50px]"> Loading...</h1>
      </div>
    );
  } else {
    return (
      <SplitBlock>
        <Suspense fallback={null}>
          <Editor
            setFunction={setEditorContent}
            editorContent={editorContent}
          />
        </Suspense>
        <MetaDataForm discard={discard} post={post} />
      </SplitBlock>
    );
  }
}

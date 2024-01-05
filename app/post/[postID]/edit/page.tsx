"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Desktop Components
import NewPostDesktop from "@/app/post/[postID]/edit/(edit)/desktop/EditPost";

// Types
import { TThread } from "@/interfaces/Thread";

// APIs Request Function
import { getPostAPI } from "@/app/post/[postID]/edit/(edit)/apis/postAPI";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";


export default function EditPostPage({ params }: { params: { postID: string } }) {
  const { isLogin, token, userData, isLoading } = useUserAccount();
  const route = useRouter();
  const isMobile = useIsMobile();

  // const [postButtonDisable, setPostButtonDisable] = useState<boolean>(false);
  const [oldPostData, setOldPostData] = useState<TThread | null>();

  useEffect(() => {
    // if ((!isLoading && !isLogin) || (!isLoading && postData?.user !== userData?._id)) {
    //   route.push(`/post/${params.postID}`);
    // }
  }, [oldPostData, userData, isLoading, isLogin, route, params.postID]);

  useEffect(() => {
    (async () => {
      const { postID } = params;
      const res = await getPostAPI(postID);
      if (res.status !== 2000) {
        route.push("/");
      }
      setOldPostData(res.data);
    })();
  }, [params, route, userData]);

  // if (isLoading || !postData || !userData || postData?.user !== userData?._id) {
  //   return (
  //     <div></div>
  //   );
  // }

  return isMobile ? (
    <></>
  ) : (
    <NewPostDesktop
      data={oldPostData!}
      // setPostData={setPostData}
      // discardFunction={discard}
      // postFunction={NewPostAPI}
      token={token!}
    // handleFormEventFunction={handleFormChange}
    // postButtonDisable={postButtonDisable}
    ></NewPostDesktop>
  );
}

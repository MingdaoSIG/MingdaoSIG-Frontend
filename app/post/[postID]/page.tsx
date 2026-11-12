import type { Metadata } from "next";

import { postMetadata } from "./metadata";
import PostPage from "./PostPage";

type Props = { params: Promise<{ postID: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postID } = await params;
  return postMetadata(postID);
}

// The post itself still loads in the browser (PostPage), as before.
export default function Page({ params }: Props) {
  return <PostPage params={params} />;
}

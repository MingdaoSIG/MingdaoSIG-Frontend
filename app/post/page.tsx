import SplitBlock from "../(Layout)/splitBlock";
import HeaderBar from "../(Layout)/HeaderBar";

import Thread from "./(Post)/Thread";
import ThreadInfo from "./(Post)/ThreadInfo";

const Post = () => {
  return (
    <>
      <HeaderBar></HeaderBar>
      <SplitBlock>
        <Thread></Thread>
        <ThreadInfo></ThreadInfo>
      </SplitBlock>
    </>
  );
};

export default Post;

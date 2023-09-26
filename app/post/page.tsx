import SplitBlock from "../(Layout)/splitBlock";

import Thread from "./(Post)/Thread";
import ThreadInfo from "./(Post)/ThreadInfo";

const Post = () => {
  return (
    <>
      <SplitBlock>
        <Thread></Thread>
        <ThreadInfo></ThreadInfo>
      </SplitBlock>
    </>
  );
};

export default Post;

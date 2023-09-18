import HeaderBar from "./(Layout)/HeaderBar";
import SplitBlock from "./(Layout)/splitBlock";
import ToolBar from "./(Layout)/ToolBar";

import ThreadsList from "./(Home)/ThreadsList";

const Home = () => {
  return (
    <>
      <HeaderBar></HeaderBar>
      <SplitBlock>
        <div>
          <ThreadsList />
        </div>
        <div>234</div>
      </SplitBlock>
      <ToolBar></ToolBar>
    </>
  );
};

export default Home;

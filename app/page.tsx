import HeaderBar from "./(Layout)/HeaderBar";
import SplitBlock from "./(Layout)/splitBlock";
import ToolBar from "./(Layout)/ToolBar";

import ThreadsList from "./(Home)/ThreadsList";
import Information from "./(Home)/Informations";

const Home = () => {
  return (
    <>
      <HeaderBar></HeaderBar>
      <SplitBlock>
        <div>
          <ThreadsList />
        </div>
        <div>
          <Information />
        </div>
      </SplitBlock>
      <ToolBar></ToolBar>
    </>
  );
};

export default Home;

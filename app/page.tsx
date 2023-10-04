import SplitBlock from "./(Layout)/splitBlock";
import ThreadList from "./(Home)/ThreadsList";
import Information from "./(Home)/Information";

const Home = () => {
  return (
    <SplitBlock>
      <div>
        <ThreadList />
      </div>
      <div>
        <Information />
      </div>
    </SplitBlock>
  );
};

export default Home;

import SplitBlock from "./(Layout)/splitBlock";
import ThreadsList from "./(Home)/ThreadsList";
import Information from "./(Home)/Information";

const Home = () => {
  return (
    <SplitBlock>
      <div>
        <ThreadsList />
      </div>
      <div className="h-full">
        <Information />
      </div>
    </SplitBlock>
  );
};

export default Home;

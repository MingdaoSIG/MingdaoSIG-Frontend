import SplitBlock from "./(Layout)/splitBlock";
import ThreadsList from "./(Home)/ThreadsList";
import Information from "./(Home)/Information";

const Home = () => {
  return (
    <SplitBlock>
      <div className="h-full w-full ">
        <ThreadsList />
      </div>
      <div className="h-full">
        <Information />
      </div>
    </SplitBlock>
  );
};

export default Home;

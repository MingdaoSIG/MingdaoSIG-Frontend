import SplitBlock from "./(Layout)/splitBlock";
import ThreadsList from "./(Home)/ThreadsList";
import Information from "./(Home)/Informations";

const Home = () => {
  return (
    <>
      <SplitBlock>
        <div>
          <ThreadsList />
        </div>
        <div>
          <Information />
        </div>
      </SplitBlock>
    </>
  );
};

export default Home;

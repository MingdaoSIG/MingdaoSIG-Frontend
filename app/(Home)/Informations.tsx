import style from "./Informations.module.scss";

const Hashtag = () => {
  return (
    <div className="my-3">
      <h2 className="text-md-dark-green text-lg font-medium tracking-widest cursor-pointer hover:underline  hover:decoration-1 transition  duration-300 ease-out  ">
        #AI
      </h2>
      <p className="text-[#A6A6A6] text-xs font-extralight tracking-widest">
        23 post
      </p>
    </div>
  );
};

const SIG = () => {
  return (
    <div className={style.sig}>
      <p>資安MDCSL</p>
    </div>
  );
};

const Information = () => {
  return (
    <div className={style.information}>
      <div className={style.hashtags}>
        <h2 className=" text-black text-base font-extralight tracking-widest">
          Hashtags
        </h2>
        <Hashtag></Hashtag>
        <Hashtag></Hashtag>
        <Hashtag></Hashtag>
      </div>
      <div className={style.sigs}>
        <h2 className=" text-black mt-10 mb-3 text-base font-extralight tracking-widest">
          SIGs
        </h2>
        <div className="flex flex-row flex-wrap gap-4 ">
          <SIG></SIG>
          <SIG></SIG>
          <SIG></SIG>
        </div>
      </div>
    </div>
  );
};

export default Information;

import Image from "next/image";

import style from "./Thread.module.scss";

const Reply = () => {
  return (
    <div className="Reply">
      <Image
        src={
          "https://github.com/banahaker/banahaker.github.io/blob/main/src/assets/logo_bana.png?raw=true"
        }
        width={45}
        height={45}
        alt="Avatar"
        className="rounded-full"
      ></Image>
    </div>
  );
};

const ThreadInfo = () => {
  return (
    <div className={style.info}>
      <div className="flex justify-between items-center">
        <div className={style.author}>
          <Image
            src={
              "https://github.com/banahaker/banahaker.github.io/blob/main/src/assets/logo_bana.png?raw=true"
            }
            width={50}
            height={50}
            alt="Avatar"
            className="rounded-full"
          ></Image>
          <div className="flex flex-col items-start justify-center">
            <div className={style.name}>葉柏辰</div>
            <div className={style.time}>2023/09/19 23:22 </div>
          </div>
        </div>
        <div className="flex">
          <Image
            src={"/icons/bxs-bookmark-star.svg"}
            height={32}
            width={32}
            alt="bookmark"
            className="cursor-pointer"
          ></Image>
          <Image
            src={"/icons/bxs-heart.svg"}
            height={32}
            width={32}
            alt="heart"
            className="cursor-pointer"
          ></Image>
        </div>
      </div>
      <div className=" mt-9">
        <Reply></Reply>
      </div>
    </div>
  );
};

export default ThreadInfo;

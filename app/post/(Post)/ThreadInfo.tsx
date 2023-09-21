import Image from "next/image";

import style from "./Thread.module.scss";

const Reply = () => {
  return (
    <div className={style.reply}>
      <Image
        src={
          "https://github.com/banahaker/banahaker.github.io/blob/main/src/assets/logo_bana.png?raw=true"
        }
        width={45}
        height={45}
        alt="Avatar"
        className="rounded-full"
      ></Image>
      <div className={style.content}>
        <div className="info flex gap-2 items-center">
          <div className="no font-semibold">@11v148</div>
          <div className="time text-sm text-gray">2023/09/19</div>
        </div>
        <p className=" font-normal text-md-dark-green">
          社長什麼時候才會交這個，我好想學喔
        </p>
      </div>
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
      <div className="mt-9 flex flex-col gap-6 overflow-auto px-3">
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
        <Reply></Reply>
      </div>
    </div>
  );
};

export default ThreadInfo;

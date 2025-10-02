import { Fragment } from "react";
import Link from "next/link";
import skeleton from "./Skeleton.module.scss";

import { homePageLinks } from "@/app/(home)/configs/linksList";

const TopPost = (child: any) => {
  return (
    <div className={skeleton.likePost}>
      <h3 className={skeleton.likeTitle}></h3>
      <p></p>
    </div>
  );
};

const SIG = (child: any) => {
  return (
    <div className={skeleton.sig}>
      <p></p>
    </div>
  );
};

export const InformationSkeleton = () => {
  const topPost = [...Array(5)];
  const sigCount = [...Array(20)];

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
      <div className={skeleton.information}>
        <div className={skeleton.wrapper}>
          <div className={skeleton.likedPosts}>
            <h2>Top 3 Posts</h2>
            <div className={skeleton.likePostWrapper}>
              {topPost.map((sig, index) => {
                return <TopPost key={index} />;
              })}
            </div>
          </div>

          <div className={skeleton.sigs}>
            <h2 className={skeleton.sigTitle}>
              SIGs - <p className={skeleton.sigCount}> </p>
            </h2>
            <div className={skeleton.sigTop}>
              {sigCount.map((sig, index) => {
                return <SIG key={index} />;
              })}
            </div>
          </div>
        </div>
        <div className={skeleton.links}>
          {homePageLinks.map(({ href, text }, index, array) => {
            return (
              <Fragment key={index}>
                <Link href={href} target="_blank" key={index}>
                  {text}
                </Link>
                {index === array.length - 1 ? "" : "•"}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

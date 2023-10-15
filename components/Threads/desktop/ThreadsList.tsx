import Image from "next/image";
import style from "./ThreadsList.module.scss";
import { IThread } from "@/interface/Thread.interface";
import { useRouter } from "next/navigation";

const Thread = ({ threadData }: { threadData: IThread }) => {
  const router = useRouter();
  return (
    <div
      className={style.thread + " cursor-pointer select-none "}
      onClick={() => router.push("/post/" + threadData._id)}
    >
      <div className={style.preview}>
        <h1 className={style.previewTitle}>{threadData.title}</h1>
        <p className={style.previewContent}>{threadData.content}</p>
      </div>
      <div className={style.cover}>
        <Image
          src={threadData.cover}
          alt="cover image"
          style={{ objectFit: "cover" }}
          priority
          sizes="100%"
          fill
        ></Image>
      </div>
    </div>
  );
};

export const ThreadsList = ({
  posts,
  height,
}: {
  posts: IThread[];
  height?: string;
}) => {
  return (
    <div className={style.threads} style={{ height: height }}>
      {posts && posts?.length >= 1 ? (
        posts.map((item, index) => {
          return <Thread threadData={item} key={index} />;
        })
      ) : (
        <div className={style.loading}>Loading...</div>
      )}
    </div>
  );
};

"use client";

import Image from "next/image";
import style from "./ThreadsList.module.scss";
import { IThread } from "@/interface/Thread.interface";
import { useRouter } from "next/navigation";

const testingData: IThread = {
  _id: "123123",
  title:
    "論文導讀 - Discovering faster matrix multiplication algorithms with reinforcement learning",
  user: "1233890",
  createdAt: "123123",
  content:
    "這篇論文介紹了一種名為AlphaTensor的人工智慧系統，它可以發現新穎、高效且可證明正確的算法，用於矩陣乘法等基本任務。這種方法可以加速涉及矩陣乘法的普遍計算，並推進對這種基本操作的理解。AlphaTensor使用了一種名為強化學習的人工智能技術，它可以自動設計算法流程。AlphaTensor將矩陣乘法的流程參數化，然後自動尋找一套好的參數......\n這篇論文介紹了一種名為AlphaTensor的人工智慧系統，它可以發現新穎、高效且可證明正確的算法，用於矩陣乘法等基本任務。這種方法可以加速涉及矩陣乘法的普遍計算，並推進對這種基本操作的理解。AlphaTensor使用了一種名為強化學習的人工智能技術，它可以自動設計算法流程。AlphaTensor將矩陣乘法的流程參數化，然後自動尋找一套好的參數......",
  cover:
    "https://images.unsplash.com/photo-1579407364450-481fe19dbfaa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80",
};

const Thread = ({ threadData }: { threadData: IThread }) => {
  const router = useRouter();
  return (
    <div className={style.thread} onClick={() => router.push("/post")}>
      <div className={style.left}>
        <h1 className="text-md-dark-green text-xl font-semibold mb-2">
          {threadData.title}
        </h1>
        <p className="text-ellipsis overflow-hidden h-[100px]">
          {threadData.content + "...."}
        </p>
      </div>
      <div className={style.right}>
        <Image
          src={threadData.cover}
          alt="coverimage"
          width={500}
          height={500}
          style={{ height: "250px", width: "inherit", borderRadius: "30px" }}
        ></Image>
      </div>
    </div>
  );
};

const ThreadsList = () => {
  return (
    <div className={style.threads}>
      <Thread threadData={testingData}></Thread>
      <Thread threadData={testingData}></Thread>
      <Thread threadData={testingData}></Thread>
      <Thread threadData={testingData}></Thread>
      <Thread threadData={testingData}></Thread>
      <Thread threadData={testingData}></Thread>
    </div>
  );
};

export default ThreadsList;

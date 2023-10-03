import style from "./Thread.module.scss";

import { IThread } from "@/interface/Thread.interface";

const testingData: IThread = {
  title:
    "論文導讀 - Discovering faster matrix multiplication algorithms with reinforcement learning",
  author: "Lazp",
  timestamp: "123123",
  content:
    "這篇論文介紹了一種名為AlphaTensor的人工智慧系統，它可以發現新穎、高效且可證明正確的算法，用於矩陣乘法等基本任務。這種方法可以加速涉及矩陣乘法的普遍計算，並推進對這種基本操作的理解。AlphaTensor使用了一種名為強化學習的人工智能技術，它可以自動設計算法流程。AlphaTensor將矩陣乘法的流程參數化，然後自動尋找一套好的參數，使其對應的算法流程的執行效率最優。這樣就可以把算法流程的設計問題轉化為一個參數的搜索/優化問題。優化目標是時間複雜度，優化手段可以是強化學習，這種方法可以加速涉及矩陣乘法的普遍計算，並推進對這種基本操作的理解。AlphaTensor使用了一種名為強化學習的人工智能技術，它可以自動設計算法流程。AlphaTensor將矩陣乘法的流程參數化，然後自動尋找一套好的參數，使其對應的算法流程的執行效率最優。這樣就可以把算法流程的設計問題轉化為一個參數的搜索/優化問題。優化目標是時間複雜度，優化手段可以是強化學習。這種方法可以加速涉及矩陣乘法的普遍計算，並推進對這種基本操作的理解。AlphaTensor將矩陣乘法的流程參數化，然後自動尋找一套好的參數，使其對應的算法流程的執行效率最優。這樣就可以把算法流程的設計問題轉化為一個參數的搜索/優化問題。優化目標是時間複雜度，優化手段可以是強化學習，這種方法可以加速涉及矩陣乘法的普遍計算，並推進對這種基本操作的理解。AlphaTensor使用了一種名為強化學習的人工智能技術，它可以自動設計算法流程。AlphaTensor將矩陣乘法的流程參數化，然後自動尋找一套好的參數，使其對應的算法流程的執行效率最優。這樣就可以把算法流程的設計問題轉化為一個參數的搜索/優化問題。優化目標是時間複雜度，優化手段可以是強化學習。這種方法可以加速涉及矩陣乘法的普遍計算，並推進對這種基本操作的理解。AlphaTensor將矩陣乘法的流程參數化，然後自動尋找一套好的參數，使其對應的算法流程的執行效率最優。這樣就可以把算法流程的設計問題轉化為一個參數的搜索/優化問題。優化目標是時間複雜度，優化手段可以是強化學習，這種方法可以加速涉及矩陣乘法的普遍計算，並推進對這種基本操作的理解。AlphaTensor使用了一種名為強化學習的人工智能技術，它可以自動設計算法流程。AlphaTensor將矩陣乘法的流程參數化，然後自動尋找一套好的參數，使其對應的算法流程的執行效率最優。這樣就可以把算法流程的設計問題轉化為一個參數的搜索/優化問題。優化目標是時間複雜度，優化手段可以是強化學習。這種方法可以加速涉及矩陣乘法的普遍計算，並推進對這種基本操作的理解。",
  coverImage:
    "https://images.unsplash.com/photo-1579407364450-481fe19dbfaa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80",
};

const Thread = () => {
  return (
    <div className={style.Thread}>
      <h1>{testingData.title}</h1>
      <p>{testingData.content}</p>
    </div>
  );
};

export default Thread;

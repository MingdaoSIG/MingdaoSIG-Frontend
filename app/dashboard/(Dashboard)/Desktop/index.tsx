"use client";

// Styles
import styles from "./index.module.scss";

// Modules
import { useState, useEffect } from "react";

export default function Desktop() {
  const [userCount, setUserCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [postUserCount, setPostUserCount] = useState(0);
  const [validPostCount, setValidPostCount] = useState(0);

  console.log(new Date().toISOString());

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/information/user?date=${new Date().toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        setUserCount(data.date.content);
      });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/information/like?date=${new Date().toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        setLikeCount(data.date.content);
      });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/information/posted?date=${new Date().toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        setPostUserCount(data.date.content);
      });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/information/post?date=${new Date().toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        setValidPostCount(data.date.content);
      });
  });


  return (
    <div>
      <div className={styles.wrapper}>
        <div className={styles.statics}>
          <div className={styles.staticsItem}>
            <div className={styles.itemWrapper}>
              <div className={styles.itemFlex}>
                <h1>使用者</h1>
                <p>{userCount || 0}</p>
              </div>
            </div>
          </div>
          <div className={styles.staticsItem}>
            <div className={styles.itemWrapper}>
              <div className={styles.itemFlex}>
                <h1>平台按讚數</h1>
                <p>{likeCount || 0}</p>
              </div>
            </div>
          </div>
          <div className={styles.staticsItem}>
            <div className={styles.itemWrapper}>
              <div className={styles.itemFlex}>
                <h1>發文人數</h1>
                <p>{postUserCount || 0}</p>
              </div>
            </div>
          </div>
          <div className={styles.staticsItem}>
            <div className={styles.itemWrapper}>
              <div className={styles.itemFlex}>
                <h1>有效貼文</h1>
                <p>{validPostCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.sigChart}>
        </div>
        {/* <div className={styles.postLists}>
          <div className={styles.postOverflow}>
            <table className={styles.postTable}>
              <tr>
                <th>ID</th>
                <th>發文人</th>
                <th>標題</th>
                <th>按讚數</th>
                <th>留言數</th>
              </tr>
              <tr className={styles.contentTR}>
                <td>1</td>
                <td>11V440</td>
                <td>臺灣資安大會 十週年鉅獻</td>
                <td>2</td>
                <td>0</td>
              </tr>
              <tr className={styles.contentTR}>
                <td>2</td>
                <td>11S085</td>
                <td>(中英對照) 透過 GitHub Actions 來精簡開發流程</td>
                <td>4</td>
                <td>11</td>
              </tr>
              <tr className={styles.contentTR}>
                <td>3</td>
                <td>11V440</td>
                <td>臺灣資安大會 十週年鉅獻</td>
                <td>2</td>
                <td>0</td>
              </tr>
              <tr className={styles.contentTR}>
                <td>4</td>
                <td>11S085</td>
                <td>(中英對照) 透過 GitHub Actions 來精簡開發流程</td>
                <td>4</td>
                <td>11</td>
              </tr>
              <tr className={styles.contentTR}>
                <td>5</td>
                <td>11V440</td>
                <td>臺灣資安大會 十週年鉅獻</td>
                <td>2</td>
                <td>0</td>
              </tr>
              <tr className={styles.contentTR}>
                <td>6</td>
                <td>11S085</td>
                <td>(中英對照) 透過 GitHub Actions 來精簡開發流程</td>
                <td>4</td>
                <td>11</td>
              </tr>
              <tr className={styles.contentTR}>
                <td>7</td>
                <td>11V440</td>
                <td>臺灣資安大會 十週年鉅獻</td>
                <td>2</td>
                <td>0</td>
              </tr>
              <tr className={styles.contentTR}>
                <td>8</td>
                <td>11S085</td>
                <td>(中英對照) 透過 GitHub Actions 來精簡開發流程</td>
                <td>4</td>
                <td>11</td>
              </tr>
              <tr className={styles.contentTR}>
                <td>9</td>
                <td>11V440</td>
                <td>臺灣資安大會 十週年鉅獻</td>
                <td>2</td>
                <td>0</td>
              </tr>
              <tr className={styles.contentTR}>
                <td>10</td>
                <td>11S085</td>
                <td>(中英對照) 透過 GitHub Actions 來精簡開發流程</td>
                <td>4</td>
                <td>11</td>
              </tr>
              <tr className={styles.contentTR}>
                <td>11</td>
                <td>11V440</td>
                <td>臺灣資安大會 十週年鉅獻</td>
                <td>2</td>
                <td>0</td>
              </tr>
              <tr className={styles.contentTR}>
                <td>12</td>
                <td>11S085</td>
                <td>(中英對照) 透過 GitHub Actions 來精簡開發流程</td>
                <td>4</td>
                <td>11</td>
              </tr>
            </table>
          </div>
      </div> */}
      </div>
    </div >
  );
}
import { useState } from "react";
import type { Sig } from "@/interfaces/Sig";
import styles from "./index.module.scss";

export default function Mobile() {
  const [sigData, setSigData] = useState<Sig | 0 | null>(null);

  // useEffect(() => {
  //   fetch("/ping")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setPing(data);
  //     });
  // }, []);
  function searchSigData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements[0] as HTMLInputElement;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/${input.value}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 4013) {
          return setSigData(0);
        }
        return setSigData(data.data);
      });
  }

  return (
    <div className={styles.mobileView}>
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <h1>MDSIG 資料查詢系統</h1>
        </div>
        <div className={styles.content}>
          <div>
            <h1>SIG 資料查詢</h1>
            <form className={styles.searchForm} onSubmit={searchSigData}>
              <input type="text" placeholder="@mdcsl" />
              <button type="submit">查詢</button>
            </form>
            <div>
              {sigData === 0 && <h1>Data not found.</h1>}
              {sigData !== null && sigData !== 0 ? (
                <div className={styles.sigDataWrapper}>
                  <div>
                    <h1>{sigData.name}</h1>
                    <p>ID: {sigData._id}</p>
                    <p>Custom ID: {sigData.customId}</p>
                    <p>Description: {sigData.description}</p>
                    <p>Avatar: {sigData.avatar}</p>
                    <p>Moderator: {sigData.moderator}</p>
                    <p>Leader: {sigData.leader}</p>
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
            {/* <h1>使用者資料查詢</h1> */}
          </div>
        </div>
      </div>
    </div>
  );
}

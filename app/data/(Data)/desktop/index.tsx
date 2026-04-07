import styles from "./index.module.scss";

export default function Desktop() {
  return (
    <div>
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <h1>MDSIG 資料查詢系統</h1>
        </div>
        <div className={styles.content}></div>
      </div>
    </div>
  );
}

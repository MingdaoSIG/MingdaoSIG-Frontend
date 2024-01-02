import styles from "./Failed.module.scss";

export default function Failed({ message }: { message: string }) {
  return (
    <>
      <svg className={styles.status_svg} version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130.2 130.2">
        <circle className={styles.status_path + " " + styles.circle} fill="none" stroke="#D06079" strokeWidth="6" strokeMiterlimit="10" cx="65.1" cy="65.1" r="62.1" />
        <line className={styles.path + " " + styles.line} fill="none" stroke="#D06079" strokeWidth="6" strokeLinecap="round" strokeMiterlimit="10" x1="34.4" y1="37.9" x2="95.8" y2="92.3" />
        <line className={styles.path + " " + styles.line} fill="none" stroke="#D06079" strokeWidth="6" strokeLinecap="round" strokeMiterlimit="10" x1="95.8" y1="38" x2="34.4" y2="92.2" />
      </svg>
      <h1 className={styles.status_text + " " + styles.error}>{message}</h1>
    </>
  );
}
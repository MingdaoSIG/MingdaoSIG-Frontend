import styles from "./Success.module.scss";

export default function Success({ message }: { message: string }) {
  return (
    <>
      <svg
        className={styles.status_svg}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 130.2 130.2"
      >
        <circle
          className={styles.status_path + " " + styles.circle}
          fill="none"
          stroke="#73AF55"
          strokeWidth="6"
          strokeMiterlimit="10"
          cx="65.1"
          cy="65.1"
          r="62.1"
        />
        <polyline
          className={styles.status_path + " " + styles.check}
          fill="none"
          stroke="#73AF55"
          strokeWidth="6"
          strokeLinecap="round"
          strokeMiterlimit="10"
          points="100.2,40.2 51.5,88.8 29.8,67.5 "
        />
      </svg>
      <h1 className={styles.status_text + " " + styles.success}>{message}</h1>
    </>
  );
}

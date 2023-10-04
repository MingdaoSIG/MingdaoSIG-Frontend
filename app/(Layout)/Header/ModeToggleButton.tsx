import styles from "./ModeToggleButton.module.scss";
import "./ModeToggleButton.scss";

export default function Button() {
  return (
    <div className={"wrapper " + styles.wrapper}>
      <input
        type="checkbox"
        id={"hide-checkbox"}
        className={styles["hide-checkbox"] + " hide-checkbox"}
      />
      <label htmlFor="hide-checkbox" className={"toggle " + styles.toggle}>
        <span className={"toggle-button " + styles["toggle-button"]}></span>
        <span
          className={"star star-1 " + styles.star + " " + styles["star-1"]}
        ></span>
        <span
          className={"star star-2 " + styles.star + " " + styles["star-2"]}
        ></span>
        <span
          className={"star star-3 " + styles.star + " " + styles["star-3"]}
        ></span>
        <span
          className={"star star-4 " + styles.star + " " + styles["star-4"]}
        ></span>
        <span
          className={"star star-5 " + styles.star + " " + styles["star-5"]}
        ></span>
        <span
          className={"star star-6 " + styles.star + " " + styles["star-6"]}
        ></span>
        <span
          className={"star star-7 " + styles.star + " " + styles["star-7"]}
        ></span>
      </label>
    </div>
  );
}

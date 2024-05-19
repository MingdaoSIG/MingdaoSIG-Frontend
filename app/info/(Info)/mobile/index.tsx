// Styles
import styles from "./index.module.scss";

// Modules
import Link from "next/link";
import { Fragment } from "react";

// data
import data from "../config/data.json";

export default function Mobile() {
  return (
    <div className={styles.mobileView}>
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <h1>MDSIG 平台資訊</h1>
        </div>
        <div className={styles.content}>
          <div>
            {
              data.map((item, index) => {
                return (
                  <Fragment key={index}>
                    <h1 className={(index === 0 ? styles.links : styles.links2)}>{item.name}</h1>
                    {
                      item.children.map((child, childIndex) => {
                        return (
                          <Fragment key={childIndex}>
                            <Link href={child.url} target="_blank" key={childIndex}>{child.name}</Link>
                            <br />
                          </Fragment>
                        );
                      })
                    }
                  </Fragment>
                );
              })
            }
          </div>
        </div>
      </div>
    </div >
  );
}
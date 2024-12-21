/* eslint-disable react-hooks/exhaustive-deps */
"use client";

// Styles
import styles from "./index.module.scss";

// Modules
import { useState, useEffect, FormEventHandler, FormEvent } from "react";
import sigAPI from "@/modules/sigAPI";
import axios from "axios";


export default function Desktop() {
  const [SIGs, setSIGs] = useState<{ _id: string; name: string }[] | null>(null);
  const [memberData, setMemberData] = useState();
  // const [memberData, setMemberData] = useState();

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigList();
        setSIGs(response);
      } catch (error: any) {
        console.error(error.message);
      }
    })();
  }, []);

  function searchSIGMember(e: any) {
    e.preventDefault();
    const sig = e.target.sig.value;
  }

  return (
    <div>
      <div className={styles.wrapper}>
        <div className={styles.searchWrapper}>
          <h1 className={styles.searchTitle}>SIG Member Search</h1>
          <div className={styles.searchBar}>
            <form className={styles.searchForm} onSubmit={searchSIGMember}>
              <label className={styles.inputLabel}>SIGs:</label>
              <div className={styles.inputSelect}>
                <select
                  name="sig"
                >
                  {SIGs?.map((sig) => {
                    return (
                      <option value={sig._id} key={sig._id}>
                        {sig.name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button
                className={styles.searchButton}
                type="submit"
              >
                Search
              </button>
            </form>
          </div>
        </div>
        <div className={styles.searchWrapper}>
          <h1 className={styles.searchTitle}>SIG Month Analytics</h1>
          <div className={styles.searchBar}>
            <form className={styles.searchForm}>
              <label className={styles.inputLabel}>SIGs:</label>
              <div className={styles.inputSelect}>
                <select
                  name="sig"
                  disabled
                  className="hover:cursor-not-allowed"
                >
                  {/* {SIGs?.map((sig) => {
                    return (
                      <option value={sig._id} key={sig._id}>
                        {sig.name}
                      </option>
                    );
                  })} */}
                  <option>此功能尚未開放使用</option>
                </select>
              </div>
              <button
                className={styles.searchButton + " cursor-not-allowed"}
                type="submit"
                disabled
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>
    </div >
  );
}
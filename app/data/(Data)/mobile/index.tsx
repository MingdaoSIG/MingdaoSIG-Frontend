import { useState } from "react";
import type { Sig } from "@/interfaces/Sig";
import { apiRequest } from "@/modules/api/client";
import styles from "./index.module.scss";

export default function Mobile() {
  const [sigData, setSigData] = useState<Sig | 0 | null>(null);
  const [message, setMessage] = useState("Data not found.");
  const [searching, setSearching] = useState(false);

  async function searchSigData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements[0] as HTMLInputElement;
    const query = input.value.trim();
    if (!query || searching) {
      return;
    }
    // Accept "@mdcsl" (custom id) or a raw SIG id; anything else is
    // looked up as typed and simply comes back "not found".
    setSearching(true);
    const result = await apiRequest<Sig>(
      `/sig/${encodeURIComponent(query).replace(/^%40/, "@")}`,
    );
    setSearching(false);
    if (result.ok && typeof result.data?._id === "string") {
      setSigData(result.data);
      return;
    }
    setMessage(
      result.ok || result.kind === "not-found"
        ? "Data not found."
        : result.message,
    );
    setSigData(0);
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
              {sigData === 0 && <h1>{message}</h1>}
              {sigData !== null && sigData !== 0 ? (
                <div className={styles.sigDataWrapper}>
                  <div>
                    <h1>{sigData.name}</h1>
                    <p>ID: {sigData._id}</p>
                    <p>Custom ID: {sigData.customId}</p>
                    <p>Description: {sigData.description}</p>
                    <p>Avatar: {sigData.avatar}</p>
                    <p>Moderator: {listOf(sigData.moderator)}</p>
                    <p>Leader: {listOf(sigData.leader)}</p>
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

function listOf(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : "";
}

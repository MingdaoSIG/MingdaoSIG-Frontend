"use client";

import styles from "./MetaDataForm.module.scss";
import Buttons from "./Buttons";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function MetaDataForm({
  discard,
  post,
}: {
  discard: any;
  post: any;
}) {
  const { data: session, status } = useSession();

  const [sigs, setSigs] = useState<any[]>([]);
  useEffect(() => {
    GetSigListAPI();
    async function GetSigListAPI() {
      try {
        const res = await (
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/list`, {
            method: "GET",
          })
        ).json();
        setSigs(res.postData);
        return;
      } catch (error) {
        console.log(error);
      }
    }
  }, []);
  if (status === "unauthenticated") {
    return (
      <div className="h-full bg-[rgba(255,_255,_255,_0.47)] rounded-[30px] w-full flex flex-col p-2">
        <h1 className="text-[30px] text-center m-auto">You have to login.</h1>
      </div>
    );
  } else if (status === "loading") {
    return <div></div>;
  } else {
    return (
      <form className={"h-full"} onSubmit={(e) => post(e)}>
        <div className={styles.meta}>
          <div className={"px-5 py-5 flex flex-col"}>
            <span className="text-lg">Title:</span>
            <input type="text" className={"rounded-full h-8 px-2"} />
            <span className="text-lg mt-3">SIGs:</span>
            <select className={"rounded-full h-8 px-2"}>
              {/* {sigs?.map((sig) => {
                return (
                  <option value={sig._id} key={sig._id}>
                    {sig.name}
                  </option>
                );
              })} */}
            </select>
            <span className="text-lg mt-3">Hashtag:</span>
            <input
              type="text"
              className={
                "rounded-full h-8 px-2 disabled:opacity-40 disabled:bg-white"
              }
              disabled
            />
          </div>
        </div>
        <Buttons
          discard={(e: any) => {
            discard(e);
          }}
        />
      </form>
    );
  }
}
